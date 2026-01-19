import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  first_name: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  last_name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  user_role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  first_name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  last_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  user_role?: UserRole;

  @IsOptional()
  is_active?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  new_password: string;
}

export class ChangeRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
