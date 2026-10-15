import { Controller, Get, Header, NotFoundException, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { paths } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

export const faviconDir = path.join(paths.uploadDir, '_favicon');

/**
 * Serves the generated favicon set at the root URLs browsers expect (/favicon.ico, ...) and the web manifest.
 * The files come from UPLOAD_DIR/_favicon, which is rewritten whenever the favicon changes in admin settings.
 * Links in the page head carry ?v=<faviconId>, so one-day caching is safe.
 */
@Controller()
export class FaviconController {
  constructor(private readonly prisma: PrismaService) {}

  private send(res: Response, file: string, type: string) {
    const full = path.join(faviconDir, file);
    if (!fs.existsSync(full)) throw new NotFoundException();
    res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' });
    res.sendFile(full);
  }

  @Get('favicon.ico')
  ico(@Res() res: Response) { this.send(res, 'favicon.ico', 'image/x-icon'); }

  @Get('favicon-32x32.png')
  png32(@Res() res: Response) { this.send(res, 'favicon-32x32.png', 'image/png'); }

  @Get('apple-touch-icon.png')
  apple(@Res() res: Response) { this.send(res, 'apple-touch-icon.png', 'image/png'); }

  @Get('icon-192.png')
  icon192(@Res() res: Response) { this.send(res, 'icon-192.png', 'image/png'); }

  @Get('icon-512.png')
  icon512(@Res() res: Response) { this.send(res, 'icon-512.png', 'image/png'); }

  @Get('site.webmanifest')
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=86400')
  async manifest() {
    const s = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new NotFoundException();
    const v = s.faviconId ? `?v=${s.faviconId}` : '';
    return {
      name: s.siteName,
      short_name: s.brandName,
      start_url: '/',
      display: 'standalone',
      theme_color: s.themeColor,
      background_color: '#ffffff',
      icons: [
        { src: `/icon-192.png${v}`, sizes: '192x192', type: 'image/png' },
        { src: `/icon-512.png${v}`, sizes: '512x512', type: 'image/png' },
      ],
    };
  }
}
