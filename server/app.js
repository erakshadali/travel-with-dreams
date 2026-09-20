import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import catalogRouter from './routes/catalog.js';
import formsRouter from './routes/forms.js';
import { ValidationError } from './lib/validate.js';

// The Express app, without `listen`, so it can run both as a normal server (server/index.js)
// and as a serverless function on Vercel (api/index.js).
const app = express();
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

app.disable('x-powered-by');
// Behind Vercel's proxy the real client IP is in X-Forwarded-For; the rate limiter needs it.
if (process.env.VERCEL) app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', catalogRouter);
app.use('/api', formsRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production (`npm run build && npm start`) Express also serves the built React app.
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // Client-side routes fall back to index.html; a missing file (e.g. a stale /assets/x.js) stays a real 404.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || path.extname(req.path)) return next();
    return res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof ValidationError) return res.status(422).json({ error: 'Please fix the highlighted fields.', fields: err.errors });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

export default app;
