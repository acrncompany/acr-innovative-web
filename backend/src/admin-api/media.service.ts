import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { paths } from '../config/env';
import { processImage } from '../common/image-processor';
import { PrismaService } from '../prisma/prisma.service';

export type MediaUsage = { type: string; id: number | null; title: string; adminPath: string };

/** Detect JPG / PNG / WebP from the file's first bytes (never trust the file name or the browser's mime type). */
function detectImageType(buf: Buffer): '.jpg' | '.png' | '.webp' | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return '.webp';
  return null;
}

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Validate, resize/convert (WebP) and store an uploaded image, then register it. Alt text is required. */
  async create(file: Express.Multer.File | undefined, alt: string) {
    if (!file) throw new BadRequestException('No file was uploaded (field name must be "file").');
    const type = detectImageType(file.buffer);
    if (!type) throw new BadRequestException('Only JPG, PNG or WebP images are allowed.');

    const img = await processImage(file.buffer, `upload${type}`); // falls back to the original if sharp is unavailable
    const now = new Date();
    const rel = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${randomBytes(10).toString('hex')}${img.ext}`;
    const dest = path.join(paths.uploadDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, img.buffer);

    const media = await this.prisma.media.create({
      data: { path: rel, alt: alt.trim(), width: img.width, height: img.height, mimeType: img.mimeType, sizeBytes: img.buffer.length },
    });
    return this.view(media);
  }

  view<T extends { path: string }>(m: T) {
    return { ...m, url: `/uploads/${m.path}` };
  }

  async list(opts: { search?: string; page: number; limit: number }) {
    const where: Prisma.MediaWhereInput = opts.search ? { OR: [{ alt: { contains: opts.search } }, { path: { contains: opts.search } }] } : {};
    const [total, items] = await Promise.all([
      this.prisma.media.count({ where }),
      this.prisma.media.findMany({ where, orderBy: { id: 'desc' }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
    ]);
    return { total, page: opts.page, limit: opts.limit, items: items.map((m) => this.view(m)) };
  }

  async get(id: number) {
    const m = await this.prisma.media.findUnique({ where: { id } });
    if (!m) throw new NotFoundException();
    return m;
  }

  async updateAlt(id: number, alt: string) {
    await this.get(id);
    return this.view(await this.prisma.media.update({ where: { id }, data: { alt: alt.trim() } }));
  }

  /** Everything that uses this image: direct references plus images embedded inside rich text. */
  async usage(id: number): Promise<MediaUsage[]> {
    const media = await this.get(id);
    const p = this.prisma;
    const embedded = { contains: `/uploads/${media.path}` }; // <img src="/uploads/..."> inside rich text
    const out: MediaUsage[] = [];
    const add = (type: string, rows: any[], title: (r: any) => string, adminPath: (r: any) => string) =>
      rows.forEach((r) => out.push({ type, id: r.id ?? null, title: title(r), adminPath: adminPath(r) }));

    const [settings, pages, blocks, slides, stats, team, services, posts, jobs] = await Promise.all([
      p.siteSettings.findMany({ where: { OR: [{ logoId: id }, { footerLogoId: id }, { faviconId: id }, { defaultOgImageId: id }] } }),
      p.page.findMany({ where: { ogImageId: id } }),
      p.contentBlock.findMany({ where: { OR: [{ mediaId: id }, { type: 'RICHTEXT', value: embedded }] } }),
      p.heroSlide.findMany({ where: { imageId: id } }),
      p.stat.findMany({ where: { iconId: id } }),
      p.teamMember.findMany({ where: { photoId: id } }),
      p.service.findMany({ where: { OR: [{ ogImageId: id }, { body: embedded }] } }),
      p.post.findMany({ where: { OR: [{ coverId: id }, { ogImageId: id }, { body: embedded }] } }),
      p.job.findMany({ where: { OR: [{ ogImageId: id }, { description: embedded }] } }),
    ]);
    add('Site settings', settings, () => 'Logo / favicon / share image', () => '/settings');
    add('Page SEO', pages, (r) => r.title, (r) => `/pages/${r.key}`);
    add('Page content', blocks, (r) => `${r.pageKey}: ${r.label}`, (r) => `/pages/${r.pageKey}`);
    add('Hero slide', slides, (r) => r.heading.replace(/\n/g, ' '), (r) => `/hero-slides/${r.id}`);
    add('Statistic', stats, (r) => r.label, (r) => `/stats/${r.id}`);
    add('Team member', team, (r) => r.name, (r) => `/team/${r.id}`);
    add('Service', services, (r) => r.title, (r) => `/services/${r.id}`);
    add('Insight post', posts, (r) => r.title, (r) => `/posts/${r.id}`);
    add('Job', jobs, (r) => r.title, (r) => `/jobs/${r.id}`);
    return out;
  }

  /** Refuses (409) while the image is still used anywhere; the response lists where. */
  async remove(id: number) {
    const media = await this.get(id);
    const usage = await this.usage(id);
    if (usage.length) throw new ConflictException({ statusCode: 409, message: 'This image is still in use. Replace it in these places first.', usage });
    try {
      await this.prisma.media.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException({ statusCode: 409, message: 'This image is still in use.', usage: await this.usage(id) });
      }
      throw e;
    }
    fs.rmSync(path.join(paths.uploadDir, media.path), { force: true });
  }
}
