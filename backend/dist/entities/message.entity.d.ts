import { User } from './user.entity';
import { Room } from './room.entity';
import { MessageReaction } from './message-reaction.entity';
export declare class Message {
    id: string;
    content: string;
    userId: string;
    roomId: string;
    createdAt: Date;
    user: User;
    room: Room;
    reactions: MessageReaction[];
}
