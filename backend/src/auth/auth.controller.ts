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

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return { message: 'No refresh token provided', accessToken: null, refreshToken: null };
    }

    const result = await this.authService.refresh(refreshToken);

    // Store new JWT in secure HTTP-only cookie (15 min access token)
    req.res?.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Store new refresh token in secure HTTP-only cookie (7 days)
    req.res?.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    const result = await this.authService.logout();

    // Clear access token cookie
    req.res?.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Clear refresh token cookie
    req.res?.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Destroy session
    if (req.session) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
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