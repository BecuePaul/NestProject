import { IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: 'Display color must be a valid hex color (e.g., #3B82F6)',
  })
  displayColor?: string;
}
