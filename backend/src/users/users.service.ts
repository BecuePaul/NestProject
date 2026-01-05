import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    if (updateProfileDto.username && updateProfileDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
      user.username = updateProfileDto.username;
    }

    if (updateProfileDto.displayColor) {
      user.displayColor = updateProfileDto.displayColor;
    }

    await this.userRepository.save(user);
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.findOne(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayColor: user.displayColor,
      createdAt: user.createdAt,
    };
  }
}
