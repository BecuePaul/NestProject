import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: string;
        username: string;
        email: string;
        displayColor: string;
        createdAt: Date;
    }>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        username: string;
        email: string;
        displayColor: string;
    }>;
}
