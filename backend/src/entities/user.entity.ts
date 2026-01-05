import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';
import { RoomMember } from './room-member.entity';
import { MessageReaction } from './message-reaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: '#3B82F6' })
  displayColor: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => RoomMember, (roomMember) => roomMember.user)
  roomMemberships: RoomMember[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.user)
  reactions: MessageReaction[];
}
