import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

const normalizeContractorTypes = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fallback to comma-separated string parsing.
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
};

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => normalizeContractorTypes(value))
  contractor_types?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  profile_pic?: string;
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
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => normalizeContractorTypes(value))
  contractor_types?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  user_role?: UserRole;

  @IsOptional()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  profile_pic?: string;
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
