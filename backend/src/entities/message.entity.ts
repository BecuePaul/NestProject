import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { MessageReaction } from './message-reaction.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  roomId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Room, (room) => room.messages)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];
}
