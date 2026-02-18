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
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      order: { created_at: 'DESC' },
    });
    // Ensure profile_pic is always a string
    return users.map((user) => {
      let profilePic = null;
      if (user.profile_pic) {
        console.log(
          '[findAll] RAW profile_pic type:',
          typeof user.profile_pic,
          'isBuffer:',
          Buffer.isBuffer(user.profile_pic),
          'length:',
          user.profile_pic?.length || 0,
        );
        if (Buffer.isBuffer(user.profile_pic)) {
          profilePic = user.profile_pic.toString('utf-8');
          console.log(
            '[findAll] Converted from Buffer, result:',
            profilePic?.substring(0, 50),
          );
        } else if (typeof user.profile_pic === 'string') {
          profilePic = user.profile_pic;
          console.log(
            '[findAll] Already string, value:',
            profilePic?.substring(0, 50),
          );
        }
      }
      return {
        ...user,
        profile_pic: profilePic,
      };
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });
    if (!user) return null;

    // Ensure profile_pic is always a string
    let profilePic = null;
    if (user.profile_pic) {
      if (Buffer.isBuffer(user.profile_pic)) {
        profilePic = user.profile_pic.toString('utf-8');
      } else if (typeof user.profile_pic === 'string') {
        profilePic = user.profile_pic;
      }
    }
    return {
      ...user,
      profile_pic: profilePic,
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Ensure profile_pic is always a string
    let profilePic = null;
    if (user.profile_pic) {
      if (Buffer.isBuffer(user.profile_pic)) {
        // Buffer should be converted to utf-8 string (data is already base64 encoded)
        profilePic = user.profile_pic.toString('utf-8');
        console.log(
          '[UsersService findById] Converted Buffer to string, length:',
          profilePic?.length,
        );
      } else if (typeof user.profile_pic === 'string') {
        profilePic = user.profile_pic;
        console.log(
          '[UsersService findById] Already string, length:',
          profilePic?.length,
        );
      }
    }
    return {
      ...user,
      profile_pic: profilePic,
    };
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
    });
    return user || null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const users = await this.usersRepository.find({
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
    // Ensure profile_pic is always a string
    return users.map((user) => {
      let profilePic = null;
      if (user.profile_pic) {
        if (Buffer.isBuffer(user.profile_pic)) {
          profilePic = user.profile_pic.toString('utf-8');
        } else if (typeof user.profile_pic === 'string') {
          profilePic = user.profile_pic;
        }
      }
      return {
        ...user,
        profile_pic: profilePic,
      };
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async createUser(userData: any, currentUser?: any): Promise<User> {
    console.log('[UsersService.createUser] Received data:', userData);

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      console.log(
        '[UsersService.createUser] User already exists:',
        existingUser,
      );
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
    const savedUser = (await this.usersRepository.save(
      user,
    )) as unknown as User;
    console.log('[UsersService.createUser] User saved:', savedUser);

    // Log audit event
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'CREATE',
      resource: 'USER',
      resourceId: savedUser.user_id,
      details: {
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.user_role,
      },
    });

    return savedUser;
  }

  async update(id: string, updateData: any, currentUser?: any): Promise<User> {
    const dataToLog = { ...updateData };
    if (dataToLog.profile_pic) {
      dataToLog.profile_pic = `[BASE64 DATA - ${dataToLog.profile_pic.length} chars]`;
    }
    console.log(
      '[UsersService.update] Updating user:',
      id,
      'with data:',
      dataToLog,
    );

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

    // Handle profile_pic removal - if empty string is sent, set to null
    if (updateData.profile_pic === '') {
      updateData.profile_pic = null;
      console.log('[UsersService.update] Clearing profile_pic');
    }

    Object.assign(user, updateData);
    const userToLog = { ...user };
    if (userToLog.profile_pic) {
      userToLog.profile_pic = `[BASE64 DATA - ${userToLog.profile_pic.length} chars]`;
    }
    console.log('[UsersService.update] Saving updated user:', userToLog);

    // Store original values before save to detect actual changes
    const originalUser = await this.usersRepository.findOne({
      where: { user_id: id },
    });

    const savedUser = (await this.usersRepository.save(
      user,
    )) as unknown as User;
    console.log('[UsersService.update] User saved:', savedUser);

    // Log audit event - only log fields that actually changed
    const actualChanges: Record<string, any> = {};
    Object.keys(updateData).forEach((key) => {
      if (
        updateData[key] !== undefined &&
        originalUser &&
        (originalUser as any)[key] !== updateData[key]
      ) {
        if (key !== 'password') {
          // Don't log password values or large blobs
          if (key === 'profile_pic') {
            actualChanges[key] = '[UPDATED]';
          } else {
            actualChanges[key] = updateData[key];
          }
        } else {
          actualChanges[key] = '[CHANGED]';
        }
      }
    });

    // Only log if there were actual changes
    if (Object.keys(actualChanges).length > 0) {
      await this.auditLogsService.create({
        userId: currentUser?.userId,
        userName: currentUser?.username,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: id,
        details: {
          updatedFields: Object.keys(actualChanges),
          changes: actualChanges,
        },
      });
    }

    return savedUser;
  }

  async delete(id: string, currentUser?: any): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);

    // Log audit event for permanent deletion
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'DELETE',
      resource: 'USER',
      resourceId: id,
      details: { username: user.username, permanentDelete: true },
    });
  }

  async softDelete(id: string, currentUser?: any): Promise<User> {
    const user = await this.findById(id);
    user.is_deleted = true;
    user.deleted_at = new Date();
    const result = (await this.usersRepository.save(user)) as User;

    // Log audit event
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'DELETE',
      resource: 'USER',
      resourceId: id,
      details: { username: user.username },
    });

    return result;
  }

  async restore(id: string, currentUser?: any): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.is_deleted = false;
    user.deleted_at = null;
    const result = (await this.usersRepository.save(user)) as User;

    // Log audit event
    await this.auditLogsService.create({
      userId: currentUser?.userId,
      userName: currentUser?.username,
      action: 'RESTORE',
      resource: 'USER',
      resourceId: id,
      details: { username: user.username },
    });

    return result;
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

  async updateLastActive(userId: string): Promise<void> {
    try {
      await this.usersRepository.update(
        { user_id: userId },
        { last_active: new Date() },
      );
    } catch (err) {
      // Silently fail, don't block request
    }
  }
}
