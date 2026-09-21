import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { siteUrl } from './scripts/site-url.js'
import { SITE } from './src/config/site.js'

// The photo behind every page: `hero.image` from the site config, sized for full-screen use.
const backdropUrl = `${SITE.hero.image}?auto=format&fit=crop&w=1600&q=70`;

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Fills index.html from src/config/site.js: name, description, share previews, hero photo and the
// brand colours (injected as CSS variables so there is no flash of the default colours).
// Also fills the absolute URLs (share previews) with the real site address.
const siteInHtml = {
  name: 'site-in-html',
  transformIndexHtml: (html) =>
    html
      .replaceAll('__SITE_URL__', siteUrl())
      .replaceAll('__SITE_NAME__', escapeAttr(SITE.name))
      .replaceAll('__SITE_TAGLINE__', escapeAttr(SITE.tagline))
      .replaceAll('__SITE_DESCRIPTION__', escapeAttr(SITE.description))
      .replaceAll('__THEME_COLOR__', SITE.theme.primary)
      .replaceAll('__BACKDROP_URL__', escapeAttr(backdropUrl))
      .replace(
        '</head>',
        `<style>html:root{--ink:${SITE.theme.ink};--primary:${SITE.theme.primary};--accent:${SITE.theme.accent};--backdrop:url("${backdropUrl}")}</style></head>`,
      ),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteInHtml],
  server: {
    // Forward API calls to the Express server (see server/index.js).
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
