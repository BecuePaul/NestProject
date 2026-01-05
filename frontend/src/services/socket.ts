import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinRoom(roomId: string, callback: (data: any) => void) {
    this.socket?.emit('joinRoom', { roomId }, callback);
  }

  getRooms(callback: (data: any) => void) {
    this.socket?.emit('getRooms', {}, callback);
  }

  createRoom(
    name: string,
    isPrivate: boolean,
    memberIds: string[],
    memberHistoryAccess: { [userId: string]: boolean },
    callback: (data: any) => void
  ) {
    this.socket?.emit(
      'createRoom',
      { name, isPrivate, memberIds, memberHistoryAccess },
      callback
    );
  }

  sendMessage(roomId: string, content: string) {
    this.socket?.emit('sendMessage', { roomId, content });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('newMessage', callback);
  }

  sendTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, isTyping });
  }

  onTypingUsers(callback: (data: { roomId: string; users: string[] }) => void) {
    this.socket?.on('typingUsers', callback);
  }

  addReaction(messageId: string, emoji: string) {
    this.socket?.emit('addReaction', { messageId, emoji });
  }

  removeReaction(reactionId: string, messageId: string) {
    this.socket?.emit('removeReaction', { reactionId, messageId });
  }

  onReactionAdded(callback: (data: any) => void) {
    this.socket?.on('reactionAdded', callback);
  }

  onReactionRemoved(callback: (data: any) => void) {
    this.socket?.on('reactionRemoved', callback);
  }

  onConnectedUsers(callback: (data: { users: any[] }) => void) {
    this.socket?.on('connectedUsers', callback);
  }

  onRoomCreated(callback: (room: any) => void) {
    this.socket?.on('roomCreated', callback);
  }

  updateProfile(username: string, displayColor: string) {
    this.socket?.emit('updateProfile', { username, displayColor });
  }

  addMembersToRoom(
    roomId: string,
    memberIds: string[],
    memberHistoryAccess: { [userId: string]: boolean },
    callback: (data: any) => void
  ) {
    this.socket?.emit('addMembersToRoom', { roomId, memberIds, memberHistoryAccess }, callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();
