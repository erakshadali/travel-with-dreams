// Writes public/robots.txt and public/sitemap.xml before every build (see "prebuild" in package.json).
// The trip list comes from the same data file the API uses, so new trips appear automatically.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { trips } from '../server/data/trips.js';
import { siteUrl } from './site-url.js';

const base = siteUrl();
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const today = new Date().toISOString().slice(0, 10);

const pages = [
  { path: '/', priority: '1.0' },
  { path: '/trips', priority: '0.9' },
  { path: '/unexplored', priority: '0.8' },
  { path: '/about', priority: '0.5' },
  { path: '/contact', priority: '0.6' },
  ...trips.map((trip) => ({ path: `/trips/${trip.slug}`, priority: '0.8' })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url><loc>${base}${page.path}</loc><lastmod>${today}</lastmod><priority>${page.priority}</priority></url>`).join('\n')}
</urlset>
`;

// Booking pages are per-visitor forms, and /api is not for search engines.
const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /book/

Sitemap: ${base}/sitemap.xml
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
writeFileSync(path.join(publicDir, 'robots.txt'), robots);
console.log(`SEO files written for ${base} (${pages.length} pages in the sitemap)`);
