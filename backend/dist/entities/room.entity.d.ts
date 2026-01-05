import { Message } from './message.entity';
import { RoomMember } from './room-member.entity';
export declare class Room {
    id: string;
    name: string;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages: Message[];
    members: RoomMember[];
}
