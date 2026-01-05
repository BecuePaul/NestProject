import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private jwtService;
    server: Server;
    private connectedUsers;
    private typingUsers;
    constructor(chatService: ChatService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        roomId: string;
    }, client: Socket): Promise<{
        messages: any[];
    } | undefined>;
    handleMessage(data: {
        roomId: string;
        content: string;
    }, client: Socket): Promise<void>;
    handleTyping(data: {
        roomId: string;
        isTyping: boolean;
    }, client: Socket): void;
    handleAddReaction(data: {
        messageId: string;
        emoji: string;
    }, client: Socket): Promise<void>;
    handleRemoveReaction(data: {
        reactionId: string;
        messageId: string;
    }, client: Socket): Promise<void>;
    handleCreateRoom(data: {
        name: string;
        isPrivate: boolean;
        memberIds: string[];
        memberHistoryAccess: {
            [userId: string]: boolean;
        };
    }, client: Socket): Promise<{
        room: import("../entities/room.entity").Room;
    } | undefined>;
    handleGetRooms(client: Socket): Promise<{
        rooms: any[];
    } | undefined>;
    private removeUserTyping;
    private emitTypingUsers;
    private emitConnectedUsers;
}
