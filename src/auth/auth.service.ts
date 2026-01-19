import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs'; // Remove this if not using bcrypt
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

async validateUser(username: string, password: string): Promise<any> {
  console.log(`🔍 Validating user: ${username}`);
  
  const user = await this.usersService.findByUsername(username);
  
  if (!user) {
    console.log(`❌ User not found: ${username}`);
    throw new UnauthorizedException('Invalid username or password');
  }

  console.log(`✅ User found: ${user.username}`);
  
  // USE BCRYT FOR PASSWORD COMPARISON (REMOVE DIRECT COMPARISON)
  const isPasswordValid = await bcrypt.compare(password, user.password);
  // REMOVE: const isPasswordValid = password === user.password;
  
  console.log(`🔑 Password match: ${isPasswordValid}`);
  
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid username or password');
  }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (user.is_deleted) {
      throw new UnauthorizedException('Account has been deleted');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    console.log(`🚀 Login attempt for: ${loginDto.username}`);
    
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: user.email, 
      sub: user.user_id,
      role: user.user_role 
    };

    console.log(`🎉 Login successful for: ${user.username}`);
    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_role: user.user_role,
        profile_pic: user.profile_pic,
      },
    };
  }

  async refreshToken(userId: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload = {
      email: user.email,
      sub: user.user_id,
      role: user.user_role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
