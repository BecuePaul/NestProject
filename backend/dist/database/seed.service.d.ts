import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
export declare class SeedService implements OnModuleInit {
    private roomRepository;
    constructor(roomRepository: Repository<Room>);
    onModuleInit(): Promise<void>;
    private seedGeneralRoom;
}
