import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../config/env';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.register({ secret: env.jwtSecret, signOptions: { expiresIn: `${env.sessionHours}h` } })],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AdminGuard }],
  exports: [AuthService],
})
export class AuthModule {}
