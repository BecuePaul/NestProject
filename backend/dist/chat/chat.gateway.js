"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    chatService;
    jwtService;
    server;
    connectedUsers = new Map();
    typingUsers = new Map();
    constructor(chatService, jwtService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
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
        }
        catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
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
    async handleJoinRoom(data, client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        client.join(data.roomId);
        const messages = await this.chatService.getRoomMessages(data.roomId, user.userId);
        return { messages };
    }
    async handleMessage(data, client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        const message = await this.chatService.createMessage(data.roomId, user.userId, data.content);
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
    handleTyping(data, client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        if (data.isTyping) {
            if (!this.typingUsers.has(data.roomId)) {
                this.typingUsers.set(data.roomId, new Set());
            }
            this.typingUsers.get(data.roomId).add(user.userId);
        }
        else {
            this.removeUserTyping(data.roomId, user.userId);
        }
        this.emitTypingUsers(data.roomId);
    }
    async handleAddReaction(data, client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        const reaction = await this.chatService.addReaction(data.messageId, user.userId, data.emoji);
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
    async handleRemoveReaction(data, client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        await this.chatService.removeReaction(data.reactionId, user.userId);
        const message = await this.chatService.getMessageById(data.messageId);
        this.server.to(message.roomId).emit('reactionRemoved', {
            messageId: data.messageId,
            reactionId: data.reactionId,
        });
    }
    async handleCreateRoom(data, client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        const room = await this.chatService.createRoom(data.name, data.isPrivate, user.userId, data.memberIds, data.memberHistoryAccess);
        data.memberIds.forEach((memberId) => {
            const memberSocket = Array.from(this.connectedUsers.entries()).find(([_, u]) => u.userId === memberId);
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
    async handleGetRooms(client) {
        const user = this.connectedUsers.get(client.id);
        if (!user)
            return;
        const rooms = await this.chatService.getUserRooms(user.userId);
        return { rooms };
    }
    removeUserTyping(roomId, userId) {
        const typingSet = this.typingUsers.get(roomId);
        if (typingSet) {
            typingSet.delete(userId);
            if (typingSet.size === 0) {
                this.typingUsers.delete(roomId);
            }
        }
    }
    emitTypingUsers(roomId) {
        const typingUserIds = this.typingUsers.get(roomId) || new Set();
        const typingUsernames = Array.from(typingUserIds)
            .map((userId) => {
            const user = Array.from(this.connectedUsers.values()).find((u) => u.userId === userId);
            return user?.username;
        })
            .filter(Boolean);
        this.server.to(roomId).emit('typingUsers', {
            roomId,
            users: typingUsernames,
        });
    }
    emitConnectedUsers() {
        const users = Array.from(this.connectedUsers.values()).map((user) => ({
            userId: user.userId,
            username: user.username,
            displayColor: user.displayColor,
        }));
        this.server.emit('connectedUsers', { users });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('addReaction'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleAddReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeReaction'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRemoveReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getRooms'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGetRooms", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map