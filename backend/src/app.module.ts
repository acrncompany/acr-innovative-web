import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';

@Module({ imports: [PrismaModule, PublicModule] })
export class AppModule {}
