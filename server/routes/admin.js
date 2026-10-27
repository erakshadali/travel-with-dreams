import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminConfigured, endSession, hasSession, passwordMatches, requireAdmin, startSession } from '../lib/adminAuth.js';
import { STATUSES, listActivity, listSubmissions, storageMode, updateSubmission } from '../lib/adminStore.js';
import { computeStats } from '../lib/adminStats.js';
import { clean } from '../lib/validate.js';

const router = Router();

// Admin responses hold customer details, so no browser or proxy may keep a copy.
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Only wrong guesses count, so the owner is never locked out by their own successful logins.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/login', loginLimiter, (req, res) => {
  if (!adminConfigured()) return res.status(503).json({ error: 'Admin login is not set up yet. Add ADMIN_PASSWORD in the environment.' });
  if (!passwordMatches(req.body?.password)) return res.status(401).json({ error: 'That password is not correct.' });
  startSession(res);
  return res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  endSession(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ authenticated: hasSession(req), configured: adminConfigured() });
});

// Everything below needs a valid session.
router.use(requireAdmin);

// A Vercel deploy without a database has nothing to show; say so rather than listing zero bookings.
router.use((req, res, next) => {
  if (storageMode() === 'none') return res.status(503).json({ error: 'No database is connected, so there is nothing to show yet.' });
  return next();
});

router.get('/stats', async (req, res) => {
  res.json({ ...computeStats(await listSubmissions()), storage: storageMode() });
});

function filtered(items, query) {
  const text = clean(query.q, 80).toLowerCase();
  const from = clean(query.from, 10);
  const to = clean(query.to, 10);
  return items
    .filter((item) => !query.kind || item.kind === query.kind)
    .filter((item) => !query.status || item.status === query.status)
    .filter((item) => !query.trip || item.tripSlug === query.trip || item.tripTitle === query.trip)
    .filter((item) => !from || item.createdAt.slice(0, 10) >= from)
    .filter((item) => !to || item.createdAt.slice(0, 10) <= to)
    .filter(
      (item) =>
        !text ||
        [item.reference, item.name, item.email, item.phone, item.tripTitle, item.tripSlug, item.message, item.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text)),
    );
}

router.get('/submissions', async (req, res) => {
  const items = filtered(await listSubmissions(), req.query);
  res.json({ items, total: items.length });
});

router.get('/submissions/:reference', async (req, res) => {
  const item = (await listSubmissions()).find((entry) => entry.reference === req.params.reference);
  if (!item) return res.status(404).json({ error: 'Not found.' });
  return res.json(item);
});

router.patch('/submissions/:reference', async (req, res) => {
  const { status, note } = req.body ?? {};
  const current = (await listSubmissions()).find((entry) => entry.reference === req.params.reference);
  if (!current) return res.status(404).json({ error: 'Not found.' });

  if (status !== undefined && !STATUSES[current.kind].includes(status)) {
    return res.status(422).json({ error: `Status must be one of: ${STATUSES[current.kind].join(', ')}.` });
  }
  if (note !== undefined && typeof note !== 'string') return res.status(422).json({ error: 'Note must be text.' });
  if (status === undefined && note === undefined) return res.status(422).json({ error: 'Nothing to update.' });

  const updated = await updateSubmission(req.params.reference, { status, note: note === undefined ? undefined : clean(note, 1000) });
  return res.json(updated);
});

router.get('/activity', async (req, res) => {
  res.json({ items: await listActivity(100) });
});

// Spreadsheet programs run text that starts with = + - @ as a formula, and customers type these fields.
// Excel opens a UTF-8 CSV correctly only when it starts with a byte-order mark.
const BOM = String.fromCharCode(0xfeff);

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

router.get('/export.csv', async (req, res) => {
  const items = filtered(await listSubmissions(), req.query);
  const columns = [
    ['Reference', (i) => i.reference],
    ['Type', (i) => i.kind],
    ['Status', (i) => i.status],
    ['Received', (i) => i.createdAt],
    ['Name', (i) => i.name],
    ['Email', (i) => i.email],
    ['Phone', (i) => i.phone],
    ['Trip', (i) => i.tripTitle || i.tripSlug],
    ['Departure', (i) => i.departureDate],
    ['Travellers', (i) => i.travellers],
    ['Total (INR)', (i) => i.total],
    ['Customer message', (i) => i.message || i.notes],
    ['Admin note', (i) => i.note],
  ];
  const lines = [columns.map(([label]) => csvCell(label)).join(',')];
  for (const item of items) lines.push(columns.map(([, read]) => csvCell(read(item))).join(','));

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${req.query.kind || 'submissions'}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(BOM + lines.join('\r\n'));
});

export default router;
