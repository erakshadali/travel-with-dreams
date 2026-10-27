import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { EVENT_TYPES, recordEvent } from '../lib/analytics.js';
import { clean } from '../lib/validate.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
});

const SESSION_RE = /^[a-z0-9]{8,40}$/;

// Fire-and-forget from the browser: a tracking problem must never show up as an error on the site,
// so bad input and storage failures both answer 204.
router.post('/track', limiter, async (req, res) => {
  const body = req.body ?? {};
  const pagePath = clean(body.path, 200).split(/[?#]/)[0];
  const session = clean(body.session, 40);

  if (EVENT_TYPES.includes(body.type) && SESSION_RE.test(session) && pagePath.startsWith('/') && !pagePath.startsWith('/admin')) {
    let referrer = null;
    try {
      referrer = new URL(clean(body.referrer, 300)).hostname.replace(/^www\./, '').slice(0, 80) || null;
    } catch {
      // No (or unreadable) referrer means a direct visit.
    }
    if (referrer && referrer === clean(body.host, 80).replace(/^www\./, '')) referrer = null; // internal navigation
    try {
      await recordEvent({ session, type: body.type, path: pagePath, referrer, device: body.device === 'mobile' ? 'mobile' : 'desktop' });
    } catch (error) {
      console.error('[track]', error.message);
    }
  }
  res.status(204).end();
});

export default router;
