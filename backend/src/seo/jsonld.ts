import { Media, Office, SiteSettings } from '@prisma/client';

/** Serialise for a <script type="application/ld+json"> block ("<" escaped so content can't close the tag). */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

type SettingsWithLogo = SiteSettings & { logo: Media | null };

/** Business data for the home page: Organization + one LocalBusiness per office. Everything comes from the DB. */
export function businessJsonLd(siteUrl: string, s: SettingsWithLogo, offices: Office[]) {
  const orgId = `${siteUrl}/#organization`;
  const logo = s.logo ? `${siteUrl}/uploads/${s.logo.path}` : null;
  const graph: any[] = [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: s.legalName,
      url: siteUrl,
      email: s.contactEmail,
      foundingDate: s.foundingYear,
      description: s.orgDescription,
      ...(logo ? { logo } : {}),
    },
  ];
  for (const o of offices) {
    graph.push({
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}/#${o.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: `${s.siteName} — ${o.city}`,
      parentOrganization: { '@id': orgId },
      url: siteUrl,
      ...(logo ? { image: logo } : {}),
      address: {
        '@type': 'PostalAddress',
        streetAddress: o.streetAddress,
        addressLocality: o.city,
        ...(o.region ? { addressRegion: o.region } : {}),
        ...(o.postalCode ? { postalCode: o.postalCode } : {}),
        addressCountry: o.countryCode,
      },
      telephone: o.phoneRaw,
      ...(o.email ? { email: o.email } : {}),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function articleJsonLd(opts: {
  url: string; title: string; description: string; image?: string | null;
  authorName: string; publishedAt: Date | null; updatedAt: Date; publisherName: string; logo?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    headline: opts.title.slice(0, 110),
    description: opts.description,
    ...(opts.image ? { image: [opts.image] } : {}),
    author: { '@type': 'Person', name: opts.authorName },
    publisher: {
      '@type': 'Organization',
      name: opts.publisherName,
      ...(opts.logo ? { logo: { '@type': 'ImageObject', url: opts.logo } } : {}),
    },
    datePublished: (opts.publishedAt ?? opts.updatedAt).toISOString(),
    dateModified: opts.updatedAt.toISOString(),
  };
}
