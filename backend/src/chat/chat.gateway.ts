import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, { socketId: string; userId: string; username: string; displayColor: string }>();
  private typingUsers = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.chatService.getUserById(payload.sub);

      this.connectedUsers.set(client.id, {
        socketId: client.id,
        userId: user.id,
        username: user.username,
        displayColor: user.displayColor,
      });

      this.emitConnectedUsers();

      console.log(`User connected: ${user.username} (${client.id})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.typingUsers.forEach((users, roomId) => {
        if (users.has(user.userId)) {
          users.delete(user.userId);
          this.emitTypingUsers(roomId);
        }
      });

      this.connectedUsers.delete(client.id);
      this.emitConnectedUsers();
      console.log(`User disconnected: ${user.username}`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    client.join(data.roomId);

    const messages = await this.chatService.getRoomMessages(
      data.roomId,
      user.userId,
    );

    return { messages };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const message = await this.chatService.createMessage(
      data.roomId,
      user.userId,
      data.content,
    );

    this.removeUserTyping(data.roomId, user.userId);

    this.server.to(data.roomId).emit('newMessage', {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      user: {
        id: user.userId,
        username: user.username,
        displayColor: user.displayColor,
      },
      reactions: [],
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    if (data.isTyping) {
      if (!this.typingUsers.has(data.roomId)) {
        this.typingUsers.set(data.roomId, new Set());
      }
      this.typingUsers.get(data.roomId)!.add(user.userId);
    } else {
      this.removeUserTyping(data.roomId, user.userId);
    }

    this.emitTypingUsers(data.roomId);
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @MessageBody() data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const reaction = await this.chatService.addReaction(
      data.messageId,
      user.userId,
      data.emoji,
    );

    const message = await this.chatService.getMessageById(data.messageId);

    this.server.to(message.roomId).emit('reactionAdded', {
      messageId: data.messageId,
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
        userId: user.userId,
        username: user.username,
      },
    });
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @MessageBody() data: { reactionId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    await this.chatService.removeReaction(data.reactionId, user.userId);

    const message = await this.chatService.getMessageById(data.messageId);

    this.server.to(message.roomId).emit('reactionRemoved', {
      messageId: data.messageId,
      reactionId: data.reactionId,
    });
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody()
    data: { name: string; isPrivate: boolean; memberIds: string[]; memberHistoryAccess: { [userId: string]: boolean } },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const room = await this.chatService.createRoom(
      data.name,
      data.isPrivate,
      user.userId,
      data.memberIds,
      data.memberHistoryAccess,
    );

    data.memberIds.forEach((memberId) => {
      const memberSocket = Array.from(this.connectedUsers.entries()).find(
        ([_, u]) => u.userId === memberId,
      );
      if (memberSocket) {
        this.server.to(memberSocket[0]).emit('roomCreated', {
          id: room.id,
          name: room.name,
          isPrivate: room.isPrivate,
        });
      }
    });

    return { room };
  }

  @SubscribeMessage('getRooms')
  async handleGetRooms(@ConnectedSocket() client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const rooms = await this.chatService.getUserRooms(user.userId);
    return { rooms };
  }

  private removeUserTyping(roomId: string, userId: string) {
    const typingSet = this.typingUsers.get(roomId);
    if (typingSet) {
      typingSet.delete(userId);
      if (typingSet.size === 0) {
        this.typingUsers.delete(roomId);
      }
    }
  }

  private emitTypingUsers(roomId: string) {
    const typingUserIds = this.typingUsers.get(roomId) || new Set();
    const typingUsernames = Array.from(typingUserIds)
      .map((userId) => {
        const user = Array.from(this.connectedUsers.values()).find(
          (u) => u.userId === userId,
        );
        return user?.username;
      })
      .filter(Boolean);

    this.server.to(roomId).emit('typingUsers', {
      roomId,
      users: typingUsernames,
    });
  }

  private emitConnectedUsers() {
    const uniqueUsers = new Map<string, { userId: string; username: string; displayColor: string }>();
    
    Array.from(this.connectedUsers.values()).forEach((user) => {
      uniqueUsers.set(user.userId, {
        userId: user.userId,
        username: user.username,
        displayColor: user.displayColor,
      });
    });

    const users = Array.from(uniqueUsers.values());
    this.server.emit('connectedUsers', { users });
  }

  @SubscribeMessage('updateProfile')
  async handleUpdateProfile(
    @MessageBody() data: { username: string; displayColor: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    await this.chatService.updateUserProfile(user.userId, data.username, data.displayColor);

    this.connectedUsers.forEach((connectedUser, socketId) => {
      if (connectedUser.userId === user.userId) {
        connectedUser.username = data.username;
        connectedUser.displayColor = data.displayColor;
      }
    });

    this.emitConnectedUsers();

    return { success: true };
  }

  @SubscribeMessage('addMembersToRoom')
  async handleAddMembersToRoom(
    @MessageBody() data: { roomId: string; memberIds: string[]; memberHistoryAccess: { [userId: string]: boolean } },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    try {
      await this.chatService.addMembersToRoom(
        data.roomId,
        user.userId,
        data.memberIds,
        data.memberHistoryAccess,
      );

      const rooms = await this.chatService.getUserRooms(user.userId);
      const room = rooms.find(r => r.id === data.roomId);

      data.memberIds.forEach((memberId) => {
        const memberSocket = Array.from(this.connectedUsers.entries()).find(
          ([_, u]) => u.userId === memberId,
        );
        if (memberSocket && room) {
          this.server.to(memberSocket[0]).emit('roomCreated', {
            id: room.id,
            name: room.name,
            isPrivate: room.isPrivate,
          });
        }
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
