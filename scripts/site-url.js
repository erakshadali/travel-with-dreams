// The public address of the site, used for absolute URLs (sitemap, share previews).
// Priority: SITE_URL (set this when you add a custom domain) → the Vercel production
// domain (set automatically during Vercel builds) → the current Vercel address.
export function siteUrl() {
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
  return (process.env.SITE_URL || fromVercel || 'https://travel-with-dreams.vercel.app').replace(/\/+$/, '');
}
