import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { siteUrl } from './scripts/site-url.js'

// Fills the absolute URLs in index.html (share previews) with the real site address.
const siteUrlInHtml = {
  name: 'site-url-in-html',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl()),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteUrlInHtml],
  server: {
    // Forward API calls to the Express server (see server/index.js).
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
