import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'user_id',
        'username',
        'email',
        'first_name',
        'last_name',
        'phone',
        'user_role',
        'is_active',
        'created_at',
        'updated_at',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });
    return user || null;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
    });
    return user || null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.usersRepository.find({
      where: { user_role: role },
      select: [
        'user_id',
        'username',
        'email',
        'first_name',
        'last_name',
        'phone',
        'user_role',
        'is_active',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async createUser(userData: any): Promise<User> {
    console.log('[UsersService.createUser] Received data:', userData);
    
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      console.log('[UsersService.createUser] User already exists:', existingUser);
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      user_role: userData.user_role || UserRole.CLIENT,
    });

    console.log('[UsersService.createUser] Creating user:', user);
    const savedUser = await this.usersRepository.save(user);
    console.log('[UsersService.createUser] User saved:', savedUser);
    
    return savedUser as unknown as Promise<User>;
  }

  async update(id: string, updateData: any): Promise<User> {
    console.log('[UsersService.update] Updating user:', id, 'with data:', updateData);
    
    const user = await this.findById(id);

    // Check if email or username is being changed and if it's already in use
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateData.username },
      });
      if (existingUser) {
        throw new ConflictException('Username already in use');
      }
    }

    Object.assign(user, updateData);
    console.log('[UsersService.update] Saving updated user:', user);
    
    const savedUser = await this.usersRepository.save(user);
    console.log('[UsersService.update] User saved:', savedUser);
    
    return savedUser as unknown as Promise<User>;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async changePassword(id: string, passwordData: any): Promise<void> {
    const user = await this.findById(id);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      passwordData.current_password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.new_password, 10);
    user.password = hashedPassword;

    await this.usersRepository.save(user);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findById(id);
    user.is_active = !user.is_active;
    return this.usersRepository.save(user) as unknown as Promise<User>;
  }

  async changeUserRole(id: string, newRole: UserRole): Promise<User> {
    const user = await this.findById(id);
    user.user_role = newRole;
    return this.usersRepository.save(user) as unknown as Promise<User>;
  }
}
