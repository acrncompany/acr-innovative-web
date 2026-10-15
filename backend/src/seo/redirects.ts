/**
 * ALL 301 redirects live here. Edit this file to add or change one.
 *
 *  - Keys are matched case-insensitively and ignoring a trailing slash.
 *  - The query string (?a=b) is carried over to the new URL.
 *  - Point to a path on this site ("/about"), never a full URL.
 *
 * "/services" is intentionally NOT listed: it is a real page.
 */
export const redirects: Record<string, string> = {
  // Current live site: *.html URLs
  '/index.html': '/',
  '/about.html': '/about',
  '/services.html': '/services',
  '/how-we-work.html': '/how-we-work',
  '/insights.html': '/insights',
  '/careers.html': '/careers',
  '/contact.html': '/contact',

  // Old legacy site
  '/index': '/',
  '/aboutus': '/about',
  '/contactus': '/contact',
  '/contatus': '/contact', // misspelling that was in use
  '/training': '/careers',
};
