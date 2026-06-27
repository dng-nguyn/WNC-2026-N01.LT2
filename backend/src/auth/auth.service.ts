import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Hash password using argon2id
    const hashedPassword = await argon2.hash(registerDto.password, {
      type: argon2.argon2id,
    });

    const user = await this.usersService.create({
      username: registerDto.username,
      password: hashedPassword,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
    });

    // Generate JWT access and refresh tokens
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsernameWithPassword(loginDto.username);

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generate JWT access and refresh tokens
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
