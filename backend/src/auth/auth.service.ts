import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class AuthService {
  private readonly accessExpires: string;
  private readonly refreshExpires: string;
  private readonly rememberMeExpires: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessExpires = this.configService.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    this.refreshExpires = this.configService.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
    this.rememberMeExpires = this.configService.get<string>('JWT_REMEMBER_ME_EXPIRES') ?? '30d';
  }

  private signTokens(payload: { sub: string; username: string; role: string }, rememberMe = false) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.accessExpires as any });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (rememberMe ? this.rememberMeExpires : this.refreshExpires) as any,
    });
    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await argon2.hash(registerDto.password, {
      type: argon2.argon2id,
    });

    const user = await this.usersService.create({
      username: registerDto.username,
      password: hashedPassword,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
      role: UserRole.STAFF,
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const tokens = this.signTokens(payload);

    return {
      message: 'Registration successful',
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsernameWithPassword(loginDto.username);

    const isPasswordValid = await argon2.verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const tokens = this.signTokens(payload, loginDto.rememberMe);

    return {
      message: 'Login successful',
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      const newPayload = { sub: user.id, username: user.username, role: user.role };
      const tokens = this.signTokens(newPayload);

      return {
        message: 'Token refreshed',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout() {
    return { message: 'Logout successful' };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByUsernameWithPassword(
      (await this.usersService.findById(userId)).username,
    );

    const isPasswordValid = await argon2.verify(user.password, currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }
}
