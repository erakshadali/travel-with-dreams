// Owner login for the admin panel: one password, then a signed cookie that expires after 8 hours.
//
// Env vars (set in Vercel; the panel refuses to log anyone in on Vercel until ADMIN_PASSWORD exists):
//   ADMIN_PASSWORD        the owner's password
//   ADMIN_SESSION_SECRET  optional, signs the cookie; defaults to a key derived from the password
//
// On a developer machine the password falls back to "admin123" so the panel can be tried without setup.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'twd_admin';
const SESSION_MS = 8 * 60 * 60 * 1000;
const isProduction = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';

const adminPassword = () => process.env.ADMIN_PASSWORD || (isProduction ? '' : 'admin123');
const signingKey = () => process.env.ADMIN_SESSION_SECRET || `twd-admin:${adminPassword()}`;
const sign = (value) => createHmac('sha256', signingKey()).update(value).digest('hex');
const digest = (value) => createHash('sha256').update(String(value)).digest();

export const adminConfigured = () => Boolean(adminPassword());

export function passwordMatches(input) {
  if (!adminConfigured() || typeof input !== 'string') return false;
  return timingSafeEqual(digest(input), digest(adminPassword()));
}

function cookieValue(req) {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=');
  }
  return '';
}

export function hasSession(req) {
  if (!adminConfigured()) return false;
  const [expires, signature = ''] = cookieValue(req).split('.');
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const attributes = `Path=/api/admin; HttpOnly; SameSite=Strict${isProduction ? '; Secure' : ''}`;

export function startSession(res) {
  const expires = String(Date.now() + SESSION_MS);
  res.setHeader('Set-Cookie', `${COOKIE}=${expires}.${sign(expires)}; Max-Age=${SESSION_MS / 1000}; ${attributes}`);
}

export function endSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Max-Age=0; ${attributes}`);
}

export function requireAdmin(req, res, next) {
  if (hasSession(req)) return next();
  return res.status(401).json({ error: 'Please sign in.' });
}
