import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async onModuleInit() {
    await this.seedGeneralRoom();
  }

  private async seedGeneralRoom() {
    const generalRoom = await this.roomRepository.findOne({
      where: { name: 'General' },
    });

    if (!generalRoom) {
      const room = this.roomRepository.create({
        name: 'General',
        isPrivate: false,
      });
      await this.roomRepository.save(room);
      console.log('✅ General room created');
    } else {
      console.log('✅ General room already exists');
    }
  }
}
