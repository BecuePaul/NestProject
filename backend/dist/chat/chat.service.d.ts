import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { Message } from '../entities/message.entity';
import { RoomMember } from '../entities/room-member.entity';
import { MessageReaction } from '../entities/message-reaction.entity';
export declare class ChatService {
    private userRepository;
    private roomRepository;
    private messageRepository;
    private roomMemberRepository;
    private reactionRepository;
    constructor(userRepository: Repository<User>, roomRepository: Repository<Room>, messageRepository: Repository<Message>, roomMemberRepository: Repository<RoomMember>, reactionRepository: Repository<MessageReaction>);
    getUserById(userId: string): Promise<User>;
    createRoom(name: string, isPrivate: boolean, creatorId: string, memberIds: string[], memberHistoryAccess: {
        [userId: string]: boolean;
    }): Promise<Room>;
    getUserRooms(userId: string): Promise<any[]>;
    getRoomMessages(roomId: string, userId: string): Promise<any[]>;
    createMessage(roomId: string, userId: string, content: string): Promise<Message>;
    getMessageById(messageId: string): Promise<Message>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction>;
    removeReaction(reactionId: string, userId: string): Promise<void>;
}
