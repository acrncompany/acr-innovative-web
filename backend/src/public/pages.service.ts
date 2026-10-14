import { Injectable } from '@nestjs/common';
import { Media, Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { env } from '../config/env';
import { sanitizeRichText, stripHtml, truncate } from '../common/sanitize';

export type ImageView = { src: string; alt: string; width?: number | null; height?: number | null };

/** Convert a Media row to what templates need. */
export function imageView(m: Media | null | undefined): ImageView | null {
  if (!m) return null;
  return { src: `/uploads/${m.path}`, alt: m.alt, width: m.width, height: m.height };
}

export type SeoInput = {
  title?: string | null; // full <title> if given, else `${fallbackTitle} — suffix`
  fallbackTitle?: string;
  description?: string | null;
  path: string; // canonical path, e.g. "/about"
  image?: ImageView | null;
  ogType?: 'website' | 'article';
};

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Data every page needs: settings, menus, offices, socials. */
  async site() {
    const [settings, menu, offices, socials] = await Promise.all([
      this.prisma.siteSettings.findUniqueOrThrow({
        where: { id: 1 },
        include: { logo: true, footerLogo: true, favicon: true, defaultOg: true },
      }),
      this.prisma.menuItem.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.office.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.socialLink.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    const year = new Date().getFullYear();
    return {
      ...settings,
      siteUrl: env.siteUrl,
      host: new URL(env.siteUrl).host,
      logoImg: imageView(settings.logo),
      footerLogoImg: imageView(settings.footerLogo),
      faviconSrc: settings.favicon ? `/uploads/${settings.favicon.path}` : '/public/img/favicon.ico',
      copyright: settings.footerText.replace('{year}', String(year)),
      headerMenu: menu.filter((m) => m.location === 'HEADER'),
      footerMenu: menu.filter((m) => m.location === 'FOOTER'),
      offices: offices.map((o) => ({
        ...o,
        contactAddress: o.contactAddressLines || o.addressLines,
      })),
      socials,
    };
  }

  /** Content blocks of one page as a flat map: text, sanitised HTML, or an image view. */
  async blocks(pageKey: string): Promise<Record<string, any>> {
    const rows = await this.prisma.contentBlock.findMany({ where: { pageKey }, include: { media: true } });
    const out: Record<string, any> = {};
    for (const r of rows) {
      if (r.type === 'IMAGE') out[r.blockKey] = imageView(r.media);
      else if (r.type === 'RICHTEXT') out[r.blockKey] = sanitizeRichText(r.value);
      else out[r.blockKey] = r.value;
    }
    return out;
  }

  /** Build the SEO object for the layout's <head>. Everything has a sensible fallback. */
  seo(site: Awaited<ReturnType<PagesService['site']>>, input: SeoInput) {
    const suffix = site.defaultMetaTitleSuffix;
    const title = input.title?.trim() || (input.fallbackTitle ? `${input.fallbackTitle} — ${suffix}` : suffix);
    const description = (input.description?.trim() || site.defaultMetaDescription) as string;
    const image = input.image || imageView(site.defaultOg);
    const abs = (p: string) => (/^https?:/.test(p) ? p : `${env.siteUrl}${p}`);
    return {
      title,
      description,
      canonical: abs(input.path === '/' ? '/' : input.path),
      ogType: input.ogType || 'website',
      image: image ? { ...image, abs: abs(image.src) } : null,
    };
  }

  /** Published page record (title + SEO overrides). */
  async pageRecord(key: string) {
    return this.prisma.page.findUniqueOrThrow({ where: { key }, include: { ogImage: true } });
  }

  /** Common render context for a fixed page (home, about, ...). */
  async fixedPage(key: string, path: string) {
    const [site, page, b] = await Promise.all([this.site(), this.pageRecord(key), this.blocks(key)]);
    const seo = this.seo(site, {
      title: page.metaTitle,
      fallbackTitle: page.title,
      description: page.metaDescription,
      path,
      image: imageView(page.ogImage),
    });
    return { site, page, b, seo, activePath: path };
  }

  // ---- reusable queries
  publishedPostWhere() {
    return { status: Status.PUBLISHED, publishedAt: { lte: new Date() } };
  }

  postCard(p: any) {
    return {
      ...p,
      cover: imageView(p.cover),
      dateText: p.publishedAt,
      paragraphsText: p.excerpt,
      homeText: p.homeSummary || truncate(stripHtml(p.excerpt), 160),
    };
  }
}
