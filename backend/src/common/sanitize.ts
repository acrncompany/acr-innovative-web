import sanitizeHtml from 'sanitize-html';

/**
 * Whitelist for admin-authored rich text. Matches what the admin editor can produce.
 * Used when saving AND when rendering, so stored HTML is never trusted blindly.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4',
    'blockquote', 'hr', 'img', 'figure', 'figcaption', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'class'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'class'],
    span: ['class'],
    '*': [],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const out = { ...attribs };
      if (out.target === '_blank') out.rel = 'noopener noreferrer';
      else delete out.target;
      return { tagName, attribs: out };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
  },
};

export function sanitizeRichText(html: string | null | undefined): string {
  return sanitizeHtml(html ?? '', options);
}

/** Plain text (no tags), e.g. for meta descriptions. */
export function stripHtml(html: string | null | undefined): string {
  return sanitizeHtml(html ?? '', { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}

/** Truncate to max characters on a word boundary. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).trim() + '…';
}
