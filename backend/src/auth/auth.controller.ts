import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(registerDto);

    // Store JWT in secure HTTP-only cookie (15 min access token)
    req.res?.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Store refresh token in secure HTTP-only cookie (7 days)
    req.res?.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Store user info in session
    if (req.session) {
      (req.session as unknown as Record<string, unknown>).user = {
        id: result.user.id,
        username: result.user.username,
      };
    }

    return result;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(loginDto);

    // Store JWT in secure HTTP-only cookie (15 min access token)
    req.res?.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Store refresh token in secure HTTP-only cookie (7 days)
    req.res?.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Store user info in session
    if (req.session) {
      (req.session as unknown as Record<string, unknown>).user = {
        id: result.user.id,
        username: result.user.username,
      };
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return {
      message: 'Authenticated user profile',
      user: req.user,
      session: req.session && typeof req.session === 'object' && 'user' in req.session
        ? (req.session as unknown as Record<string, unknown>).user
        : null,
    };
  }
}
