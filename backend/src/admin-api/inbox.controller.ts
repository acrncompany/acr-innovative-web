import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Query, Res, ValidationPipe } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { paths } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { MarkReadDto } from './dto';

const paging = (page: string, limit: string) => {
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  return { take: l, skip: (Math.max(1, parseInt(page, 10) || 1) - 1) * l, page: Math.max(1, parseInt(page, 10) || 1), limit: l };
};
const readPipe = new ValidationPipe({ whitelist: true, transform: true, expectedType: MarkReadDto });

/** Read-only inbox for the contact form: list, open, mark read/unread. (Messages are created by the public form.) */
@Controller('api/admin/contact-messages')
export class ContactMessagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('unread') unread?: string, @Query('page') page = '1', @Query('limit') limit = '25') {
    const where = unread === 'true' ? { isRead: false } : {};
    const p = paging(page, limit);
    const [total, unreadCount, items] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.count({ where: { isRead: false } }),
      this.prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    ]);
    return { total, unread: unreadCount, page: p.page, limit: p.limit, items };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const m = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!m) throw new NotFoundException();
    return m;
  }

  @Patch(':id')
  async mark(@Param('id', ParseIntPipe) id: number, @Body(readPipe) dto: MarkReadDto) {
    const m = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!m) throw new NotFoundException();
    return this.prisma.contactMessage.update({ where: { id }, data: { isRead: dto.isRead } });
  }
}

/** Read-only inbox for job applications. CVs sit in PRIVATE_DIR (never served publicly) and are downloaded here. */
@Controller('api/admin/applications')
export class ApplicationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('unread') unread?: string, @Query('jobId') jobId?: string, @Query('page') page = '1', @Query('limit') limit = '25') {
    const where: any = { ...(unread === 'true' ? { isRead: false } : {}), ...(jobId ? { jobId: parseInt(jobId, 10) || -1 } : {}) };
    const p = paging(page, limit);
    const [total, unreadCount, items] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.count({ where: { isRead: false } }),
      this.prisma.jobApplication.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take,
        include: { job: { select: { id: true, title: true } } },
      }),
    ]);
    return { total, unread: unreadCount, page: p.page, limit: p.limit, items };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const a = await this.prisma.jobApplication.findUnique({ where: { id }, include: { job: { select: { id: true, title: true } } } });
    if (!a) throw new NotFoundException();
    return a;
  }

  @Patch(':id')
  async mark(@Param('id', ParseIntPipe) id: number, @Body(readPipe) dto: MarkReadDto) {
    const a = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!a) throw new NotFoundException();
    return this.prisma.jobApplication.update({ where: { id }, data: { isRead: dto.isRead } });
  }

  /** Authenticated download (the global admin guard covers this route). Only a bare file name from the DB is ever used. */
  @Get(':id/cv')
  async cv(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const a = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!a) throw new NotFoundException();
    const file = path.join(paths.privateDir, path.basename(a.cvFile)); // basename: no path traversal
    if (!fs.existsSync(file)) throw new NotFoundException('The CV file is missing from the server.');
    res.set({ 'Content-Type': a.cvMimeType, 'Cache-Control': 'private, no-store' });
    res.download(file, a.cvOriginalName);
  }
}
