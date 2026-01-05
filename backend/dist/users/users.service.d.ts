import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findOne(id: string): Promise<User>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User>;
    getProfile(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        displayColor: string;
        createdAt: Date;
    }>;
}
