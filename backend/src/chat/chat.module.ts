import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { Message } from '../entities/message.entity';
import { RoomMember } from '../entities/room-member.entity';
import { MessageReaction } from '../entities/message-reaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Room, Message, RoomMember, MessageReaction]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
