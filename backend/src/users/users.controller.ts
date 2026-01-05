import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(
      req.user.userId,
      updateProfileDto,
    );
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayColor: user.displayColor,
    };
  }
}
