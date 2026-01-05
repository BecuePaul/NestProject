import { Message } from './message.entity';
import { RoomMember } from './room-member.entity';
import { MessageReaction } from './message-reaction.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    displayColor: string;
    createdAt: Date;
    updatedAt: Date;
    messages: Message[];
    roomMemberships: RoomMember[];
    reactions: MessageReaction[];
}
