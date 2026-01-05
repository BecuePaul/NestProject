import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('room_members')
export class RoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  roomId: string;

  @Column({ default: true })
  hasHistoryAccess: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => User, (user) => user.roomMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Room, (room) => room.members)
  @JoinColumn({ name: 'roomId' })
  room: Room;
}
