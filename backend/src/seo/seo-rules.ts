import { stripHtml, truncate } from '../common/sanitize';

/**
 * The single place that decides how titles and descriptions are built. Used by the public pages (PagesService)
 * AND by the admin "SEO preview" endpoint, so what the founder sees in the preview is what Google gets.
 *
 * Title rules:
 *   - If a meta title is set, it is used exactly as typed.
 *   - Home page without a meta title: just the brand ("ACR Innovative Management Services"), never "Home — ...".
 *   - Any other page without a meta title: "<Page title> — <brand>".
 * (To get "Brand | tagline" on the home page, type it into the home page's meta title in the admin.)
 */
export type TitleInput = {
  metaTitle?: string | null;
  pageTitle?: string; // used when there is no meta title
  isHome?: boolean;
  siteName: string; // brand, e.g. "ACR Innovative Management Services"
  suffix?: string; // appended to non-home titles; defaults to the brand
};

export function buildTitle(i: TitleInput): string {
  const custom = i.metaTitle?.trim();
  if (custom) return custom;
  if (i.isHome || !i.pageTitle) return i.siteName;
  return `${i.pageTitle} — ${i.suffix?.trim() || i.siteName}`;
}

export function buildDescription(meta: string | null | undefined, fallbackText: string | null | undefined, siteDefault: string): string {
  const custom = meta?.trim();
  if (custom) return custom;
  const fb = stripHtml(fallbackText).trim();
  return fb ? truncate(fb, 160) : siteDefault;
}
