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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const room_entity_1 = require("../entities/room.entity");
const message_entity_1 = require("../entities/message.entity");
const room_member_entity_1 = require("../entities/room-member.entity");
const message_reaction_entity_1 = require("../entities/message-reaction.entity");
let ChatService = class ChatService {
    userRepository;
    roomRepository;
    messageRepository;
    roomMemberRepository;
    reactionRepository;
    constructor(userRepository, roomRepository, messageRepository, roomMemberRepository, reactionRepository) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.messageRepository = messageRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.reactionRepository = reactionRepository;
    }
    async getUserById(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async createRoom(name, isPrivate, creatorId, memberIds, memberHistoryAccess) {
        const room = this.roomRepository.create({
            name,
            isPrivate,
        });
        await this.roomRepository.save(room);
        const creatorMember = this.roomMemberRepository.create({
            roomId: room.id,
            userId: creatorId,
            hasHistoryAccess: true,
        });
        await this.roomMemberRepository.save(creatorMember);
        for (const memberId of memberIds) {
            if (memberId !== creatorId) {
                const member = this.roomMemberRepository.create({
                    roomId: room.id,
                    userId: memberId,
                    hasHistoryAccess: memberHistoryAccess[memberId] ?? true,
                });
                await this.roomMemberRepository.save(member);
            }
        }
        return room;
    }
    async getUserRooms(userId) {
        const memberships = await this.roomMemberRepository.find({
            where: { userId },
            relations: ['room'],
        });
        return memberships.map((membership) => ({
            id: membership.room.id,
            name: membership.room.name,
            isPrivate: membership.room.isPrivate,
            hasHistoryAccess: membership.hasHistoryAccess,
        }));
    }
    async getRoomMessages(roomId, userId) {
        const membership = await this.roomMemberRepository.findOne({
            where: { roomId, userId },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this room');
        }
        const whereCondition = { roomId };
        if (!membership.hasHistoryAccess) {
            whereCondition.createdAt = (0, typeorm_2.MoreThan)(membership.joinedAt);
        }
        const messages = await this.messageRepository.find({
            where: whereCondition,
            relations: ['user', 'reactions', 'reactions.user'],
            order: { createdAt: 'ASC' },
        });
        return messages.map((message) => ({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            user: {
                id: message.user.id,
                username: message.user.username,
                displayColor: message.user.displayColor,
            },
            reactions: message.reactions.map((reaction) => ({
                id: reaction.id,
                emoji: reaction.emoji,
                userId: reaction.user.id,
                username: reaction.user.username,
            })),
        }));
    }
    async createMessage(roomId, userId, content) {
        const membership = await this.roomMemberRepository.findOne({
            where: { roomId, userId },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this room');
        }
        const message = this.messageRepository.create({
            roomId,
            userId,
            content,
        });
        return this.messageRepository.save(message);
    }
    async getMessageById(messageId) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
    async addReaction(messageId, userId, emoji) {
        const existingReaction = await this.reactionRepository.findOne({
            where: { messageId, userId, emoji },
        });
        if (existingReaction) {
            return existingReaction;
        }
        const reaction = this.reactionRepository.create({
            messageId,
            userId,
            emoji,
        });
        return this.reactionRepository.save(reaction);
    }
    async removeReaction(reactionId, userId) {
        const reaction = await this.reactionRepository.findOne({
            where: { id: reactionId },
        });
        if (!reaction) {
            throw new common_1.NotFoundException('Reaction not found');
        }
        if (reaction.userId !== userId) {
            throw new common_1.ForbiddenException('You can only remove your own reactions');
        }
        await this.reactionRepository.remove(reaction);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(2, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(3, (0, typeorm_1.InjectRepository)(room_member_entity_1.RoomMember)),
    __param(4, (0, typeorm_1.InjectRepository)(message_reaction_entity_1.MessageReaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map