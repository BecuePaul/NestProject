import { User } from './user.entity';
import { Room } from './room.entity';
export declare class RoomMember {
    id: string;
    userId: string;
    roomId: string;
    hasHistoryAccess: boolean;
    joinedAt: Date;
    user: User;
    room: Room;
}
