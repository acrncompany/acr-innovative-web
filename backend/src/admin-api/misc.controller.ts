import { Body, Controller, Get, Post } from '@nestjs/common';
import { Status } from '@prisma/client';
import { slugify } from '../common/slug';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { buildDescription, buildTitle } from '../seo/seo-rules';
import { SeoPreviewDto } from './dto';

/** Numbers for the admin home screen. */
@Controller('api/admin/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const [unreadMessages, unreadApplications, draftPosts, publishedPosts, draftJobs, publishedJobs, services] = await Promise.all([
      this.prisma.contactMessage.count({ where: { isRead: false } }),
      this.prisma.jobApplication.count({ where: { isRead: false } }),
      this.prisma.post.count({ where: { status: Status.DRAFT } }),
      this.prisma.post.count({ where: { status: Status.PUBLISHED } }),
      this.prisma.job.count({ where: { status: Status.DRAFT } }),
      this.prisma.job.count({ where: { status: Status.PUBLISHED } }),
      this.prisma.service.count({ where: { status: Status.PUBLISHED } }),
    ]);
    return { unreadMessages, unreadApplications, draftPosts, publishedPosts, draftJobs, publishedJobs, services };
  }
}

const SECTION: Record<string, string> = { service: 'services', post: 'insights', job: 'careers' };

/**
 * Powers the "Google preview" in every SEO panel. It uses the SAME rules as the public site (seo/seo-rules.ts),
 * so the preview shows exactly the title/description visitors and search engines will get.
 * Example: the home page without a meta title previews as just the brand name, not "Home — ...".
 */
@Controller('api/admin/seo')
export class SeoPreviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('preview')
  async preview(@Body() dto: SeoPreviewDto) {
    const s = await this.prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
    let url = env.siteUrl;
    let isHome = false;
    if (dto.kind === 'page') {
      const page = dto.pageKey ? await this.prisma.page.findUnique({ where: { key: dto.pageKey } }) : null;
      isHome = page?.key === 'home';
      url += page?.slug ? `/${page.slug}` : '/';
    } else {
      url += `/${SECTION[dto.kind]}/${slugify(dto.slug || dto.title || '') || '...'}`;
    }
    const title = buildTitle({ metaTitle: dto.metaTitle, pageTitle: dto.title, isHome, siteName: s.siteName, suffix: s.defaultMetaTitleSuffix });
    const description = buildDescription(dto.metaDescription, dto.text, s.defaultMetaDescription);
    return {
      title, description, url,
      titleLength: title.length, descriptionLength: description.length,
      // Soft targets for the character counters (Google truncates around these).
      titleTarget: 60, descriptionTarget: 160,
    };
  }
}
