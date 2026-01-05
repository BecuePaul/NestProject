import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { Message } from '../entities/message.entity';
import { RoomMember } from '../entities/room-member.entity';
import { MessageReaction } from '../entities/message-reaction.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(RoomMember)
    private roomMemberRepository: Repository<RoomMember>,
    @InjectRepository(MessageReaction)
    private reactionRepository: Repository<MessageReaction>,
  ) {}

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserProfile(userId: string, username: string, displayColor: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.username = username;
    user.displayColor = displayColor;
    await this.userRepository.save(user);
  }

  async createRoom(
    name: string,
    isPrivate: boolean,
    creatorId: string,
    memberIds: string[],
    memberHistoryAccess: { [userId: string]: boolean },
  ): Promise<Room> {
    const room = this.roomRepository.create({
      name,
      isPrivate,
      creatorId,
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

  async getUserRooms(userId: string): Promise<any[]> {
    const memberships = await this.roomMemberRepository.find({
      where: { userId },
      relations: ['room'],
    });

    const roomsWithMembers = await Promise.all(
      memberships.map(async (membership) => {
        const roomMembers = await this.roomMemberRepository.find({
          where: { roomId: membership.room.id },
          relations: ['user'],
        });

        return {
          id: membership.room.id,
          name: membership.room.name,
          isPrivate: membership.room.isPrivate,
          hasHistoryAccess: membership.hasHistoryAccess,
          creatorId: membership.room.creatorId,
          isOwner: membership.room.creatorId === userId,
          memberIds: roomMembers.map((m) => m.userId),
        };
      })
    );

    return roomsWithMembers;
  }

  async getRoomMessages(roomId: string, userId: string): Promise<any[]> {
    const membership = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this room');
    }

    const whereCondition: any = { roomId };
    if (!membership.hasHistoryAccess) {
      whereCondition.createdAt = MoreThan(membership.joinedAt);
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

  async createMessage(
    roomId: string,
    userId: string,
    content: string,
  ): Promise<Message> {
    const membership = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this room');
    }

    const message = this.messageRepository.create({
      roomId,
      userId,
      content,
    });

    return this.messageRepository.save(message);
  }

  async getMessageById(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageReaction> {
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

  async removeReaction(reactionId: string, userId: string): Promise<void> {
    const reaction = await this.reactionRepository.findOne({
      where: { id: reactionId },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    if (reaction.userId !== userId) {
      throw new ForbiddenException('You can only remove your own reactions');
    }

    await this.reactionRepository.remove(reaction);
  }

  async addMembersToRoom(
    roomId: string,
    requesterId: string,
    memberIds: string[],
    memberHistoryAccess: { [userId: string]: boolean },
  ): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId !== requesterId) {
      throw new ForbiddenException('Only the room owner can add members');
    }

    for (const memberId of memberIds) {
      const existingMember = await this.roomMemberRepository.findOne({
        where: { roomId, userId: memberId },
      });

      if (!existingMember) {
        const member = this.roomMemberRepository.create({
          roomId,
          userId: memberId,
          hasHistoryAccess: memberHistoryAccess[memberId] ?? false,
        });
        await this.roomMemberRepository.save(member);
      }
    }
  }
}
