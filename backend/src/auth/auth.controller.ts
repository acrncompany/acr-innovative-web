import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { env } from '../config/env';
import { AdminSession, AuthService } from './auth.service';
import { COOKIE_NAME, CurrentAdmin, Public } from './admin.guard';

class LoginDto {
  @IsEmail() @MaxLength(200) email: string;
  @IsString() @MinLength(1) @MaxLength(200) password: string;
}

class ChangePasswordDto {
  @IsString() @MaxLength(200) currentPassword: string;
  @IsString() @MinLength(10, { message: 'New password must be at least 10 characters' }) @MaxLength(200) newPassword: string;
}

/** httpOnly: JS can't read it. SameSite=strict: never sent on cross-site requests (CSRF protection). Secure: HTTPS only (production). */
function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'strict',
    path: '/',
    maxAge: env.sessionHours * 3600 * 1000,
  });
}

@Controller('api/admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 5 attempts per minute per IP (the real client IP, thanks to "trust proxy").
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, admin } = await this.auth.login(dto.email, dto.password);
    setSessionCookie(res, token);
    return { admin };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.cookieSecure, sameSite: 'strict', path: '/' });
  }

  /** Used by the admin app on startup to find out whether the visitor is logged in. */
  @Get('me')
  me(@CurrentAdmin() admin: AdminSession) {
    return { admin };
  }

  @Post('change-password')
  @HttpCode(204)
  async changePassword(@CurrentAdmin() admin: AdminSession, @Body() dto: ChangePasswordDto, @Res({ passthrough: true }) res: Response) {
    setSessionCookie(res, await this.auth.changePassword(admin.id, dto.currentPassword, dto.newPassword));
  }
}
