import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ChangeRoleDto,
} from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    console.log('[UsersController] GET /users - findAll');
    return this.usersService.findAll();
  }

  @Get('profile')
  async getProfile(@Request() req: any): Promise<User> {
    console.log(
      '[UsersController] GET /users/profile - getProfile for user:',
      req.user.user_id,
    );
    return this.usersService.findById(req.user.user_id);
  }

  @Get('role/:role')
  async findByRole(@Param('role') role: UserRole): Promise<User[]> {
    console.log('[UsersController] GET /users/role/:role - findByRole:', role);
    return this.usersService.findByRole(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    console.log('[UsersController] GET /users/:id - findOne:', id);
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profile_pic'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<User> {
    console.log(
      '[UsersController] POST /users - create with body:',
      createUserDto,
      'file:',
      file?.filename,
    );
    try {
      // Handle profile picture file if provided
      if (file) {
        // Validate file type
        const allowedMimetypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedMimetypes.includes(file.mimetype)) {
          throw new BadRequestException(
            'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
          );
        }

        // Validate file size (5MB max)
        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          throw new BadRequestException('File size must not exceed 5MB.');
        }

        // Convert file to base64 for storage
        createUserDto.profile_pic = file.buffer.toString('base64');
        console.log(
          '[UsersController] Converted profile_pic to base64, length:',
          createUserDto.profile_pic.length,
          'first 50 chars:',
          createUserDto.profile_pic.substring(0, 50),
        );
      }

      const result = await this.usersService.createUser(createUserDto);
      console.log('[UsersController] Create success:', result);
      return result;
    } catch (error) {
      console.error('[UsersController] Create error:', error.message);
      throw error;
    }
  }

  @Post(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    console.log('[UsersController] POST /users/:id/change-password:', id);
    await this.usersService.changePassword(id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Put(':id/toggle-active')
  async toggleActive(@Param('id') id: string): Promise<User> {
    console.log('[UsersController] PUT /users/:id/toggle-active:', id);
    return this.usersService.toggleActive(id);
  }

  @Put(':id/change-role')
  async changeRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ): Promise<User> {
    console.log(
      '[UsersController] PUT /users/:id/change-role:',
      id,
      'body:',
      changeRoleDto,
    );
    return this.usersService.changeUserRole(id, changeRoleDto.role);
  }

  @Put(':id/soft-delete')
  async softDelete(@Param('id') id: string): Promise<User> {
    console.log('[UsersController] PUT /users/:id/soft-delete:', id);
    return this.usersService.softDelete(id);
  }

  @Put(':id/restore')
  async restore(@Param('id') id: string): Promise<User> {
    console.log('[UsersController] PUT /users/:id/restore:', id);
    return this.usersService.restore(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('profile_pic'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<User> {
    console.log(
      '[UsersController] PUT /users/:id - update:',
      id,
      'body:',
      updateUserDto,
      'file:',
      file?.filename,
    );
    try {
      // Handle profile picture file if provided
      if (file) {
        // Validate file type
        const allowedMimetypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedMimetypes.includes(file.mimetype)) {
          throw new BadRequestException(
            'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
          );
        }

        // Validate file size (5MB max)
        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          throw new BadRequestException('File size must not exceed 5MB.');
        }

        // Convert file to base64 for storage
        updateUserDto.profile_pic = file.buffer.toString('base64');
        console.log(
          '[UsersController] Converted profile_pic to base64, length:',
          updateUserDto.profile_pic.length,
          'first 50 chars:',
          updateUserDto.profile_pic.substring(0, 50),
        );
      }

      const result = await this.usersService.update(id, updateUserDto);
      console.log('[UsersController] Update success:', result);
      return result;
    } catch (error) {
      console.error('[UsersController] Update error:', error.message);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    console.log('[UsersController] DELETE /users/:id:', id);
    await this.usersService.delete(id);
  }
}
