import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    console.log('[UsersController] POST /users - create with body:', createUserDto);
    try {
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
    console.log('[UsersController] PUT /users/:id/change-role:', id, 'body:', changeRoleDto);
    return this.usersService.changeUserRole(id, changeRoleDto.role);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    console.log('[UsersController] PUT /users/:id - update:', id, 'body:', updateUserDto);
    try {
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
