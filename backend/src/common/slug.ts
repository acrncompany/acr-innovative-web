/** URL slug from a title: "Taxation & GST" -> "taxation-and-gst". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * Make a slug unique within a Prisma model that has a `slug` column ("my-post", "my-post-2", ...).
 * @param delegate prisma.service / prisma.post / ...
 * @param excludeId the row being edited (its own slug is allowed)
 */
export async function uniqueSlug(delegate: any, base: string, excludeId?: number): Promise<string> {
  const root = base || 'item';
  let candidate = root;
  for (let n = 2; ; n++) {
    const clash = await delegate.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${root}-${n}`;
  }
}
