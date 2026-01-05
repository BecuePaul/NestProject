import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { RoomMember } from '../entities/room-member.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(RoomMember)
    private roomMemberRepository: Repository<RoomMember>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    await this.autoJoinGeneralRoom(user.id);

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayColor: user.displayColor,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.autoJoinGeneralRoom(user.id);

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayColor: user.displayColor,
      },
      token,
    };
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  private async autoJoinGeneralRoom(userId: string): Promise<void> {
    const generalRoom = await this.roomRepository.findOne({
      where: { name: 'General' },
    });

    if (!generalRoom) {
      console.error('General room not found');
      return;
    }

    const existingMembership = await this.roomMemberRepository.findOne({
      where: { roomId: generalRoom.id, userId },
    });

    if (existingMembership) {
      return;
    }

    const member = this.roomMemberRepository.create({
      roomId: generalRoom.id,
      userId,
      hasHistoryAccess: true,
    });

    await this.roomMemberRepository.save(member);
    console.log(`User ${userId} auto-joined General room`);
  }
}
