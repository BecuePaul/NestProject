import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('message_reactions')
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  emoji: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  messageId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.reactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Message, (message) => message.reactions)
  @JoinColumn({ name: 'messageId' })
  message: Message;
}
