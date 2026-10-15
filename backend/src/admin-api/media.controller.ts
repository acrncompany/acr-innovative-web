import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors, ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaAltDto } from './dto';
import { MediaService } from './media.service';

/** Image library: upload (alt text required), list, edit alt text, see where an image is used, delete (blocked while in use). */
@Controller('api/admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  // 5 MB limit; multer answers 413 above it. Type is verified from the file's bytes in MediaService.
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File, @Body(new ValidationPipe({ whitelist: true, transform: true, expectedType: MediaAltDto })) body: MediaAltDto) {
    return this.media.create(file, body.alt);
  }

  @Get()
  list(@Query('search') search?: string, @Query('page') page = '1', @Query('limit') limit = '40') {
    return this.media.list({
      search: search?.trim() || undefined,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 40)),
    });
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.media.view(await this.media.get(id));
  }

  @Get(':id/usage')
  usage(@Param('id', ParseIntPipe) id: number) {
    return this.media.usage(id);
  }

  @Patch(':id')
  updateAlt(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe({ whitelist: true, transform: true, expectedType: MediaAltDto })) body: MediaAltDto) {
    return this.media.updateAlt(id, body.alt);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.media.remove(id);
  }
}
