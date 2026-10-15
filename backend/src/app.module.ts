import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminApiModule } from './admin-api/admin-api.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { FaviconController } from './seo/favicon.controller';
import { SeoController } from './seo/seo.controller';

@Module({
  imports: [
    // Rate limiting is opt-in per route (@UseGuards(ThrottlerGuard) + @Throttle): login and, later, the public forms.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    AdminApiModule,
    PublicModule,
  ],
  controllers: [SeoController, FaviconController],
})
export class AppModule {}
