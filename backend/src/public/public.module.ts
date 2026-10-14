import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PagesService } from './pages.service';
import { PublicController } from './public.controller';
import { PublicErrorFilter } from './not-found.filter';

@Module({
  controllers: [PublicController],
  providers: [PagesService, { provide: APP_FILTER, useClass: PublicErrorFilter }],
  exports: [PagesService],
})
export class PublicModule {}
