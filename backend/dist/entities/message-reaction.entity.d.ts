import { User } from './user.entity';
import { Message } from './message.entity';
export declare class MessageReaction {
    id: string;
    emoji: string;
    userId: string;
    messageId: string;
    createdAt: Date;
    user: User;
    message: Message;
}
