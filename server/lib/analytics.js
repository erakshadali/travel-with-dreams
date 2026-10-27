// Privacy-friendly visit tracking for the admin "Visitors" page.
//
// The website sends a random per-tab id, the page path and (for the funnel) whether a booking or enquiry
// went through. No IP address, user agent or personal detail is stored. Same storage rules as store.js:
// Postgres when DATABASE_URL is set, a JSON file on a developer machine, nothing on Vercel without a database.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { dayKey } from './adminStats.js';
import { STORAGE_DIR, getDb } from './store.js';

export const EVENT_TYPES = ['view', 'booking_done', 'enquiry_done'];
const DAY_MS = 24 * 60 * 60 * 1000;
const FILE_LIMIT = 20_000;
const mode = () => (process.env.DATABASE_URL ? 'database' : process.env.VERCEL ? 'none' : 'file');

let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = (async () => {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS site_events (
          id BIGSERIAL PRIMARY KEY,
          session TEXT NOT NULL,
          type TEXT NOT NULL,
          path TEXT NOT NULL,
          referrer TEXT,
          device TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`CREATE INDEX IF NOT EXISTS site_events_created_at_idx ON site_events (created_at)`;
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

const eventsFile = path.join(STORAGE_DIR, 'events.json');
let writeQueue = Promise.resolve();

export async function recordEvent(event) {
  if (mode() === 'database') {
    await ensureTable();
    await getDb()`
      INSERT INTO site_events (session, type, path, referrer, device)
      VALUES (${event.session}, ${event.type}, ${event.path}, ${event.referrer}, ${event.device})`;
    return;
  }
  if (mode() === 'none') return;

  const task = writeQueue.then(async () => {
    let events = [];
    try {
      events = JSON.parse(await fs.readFile(eventsFile, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    events.push({ ...event, createdAt: new Date().toISOString() });
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(eventsFile, JSON.stringify(events.slice(-FILE_LIMIT)));
  });
  writeQueue = task.catch(() => {});
  await task;
}

async function loadEvents(days) {
  const since = new Date(Date.now() - days * DAY_MS);
  if (mode() === 'database') {
    await ensureTable();
    const rows = await getDb()`
      SELECT session, type, path, referrer, device, created_at FROM site_events
      WHERE created_at >= ${since.toISOString()} ORDER BY created_at DESC LIMIT 100000`;
    return rows.map((row) => ({ ...row, createdAt: new Date(row.created_at).toISOString() }));
  }
  try {
    const events = JSON.parse(await fs.readFile(eventsFile, 'utf8'));
    return events.filter((event) => new Date(event.createdAt) >= since);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const TRIP_PATH = /^\/trips\/([a-z0-9-]+)$/;
const BOOK_PATH = /^\/book\/([a-z0-9-]+)$/;

const topCounts = (map, limit, shape) =>
  [...map].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => shape(name, count));

// `tripTitles` maps trip slug -> name so the report reads "Leh Ladakh Explorer" rather than a URL.
export async function analyticsReport(days, tripTitles = {}) {
  const events = await loadEvents(days);
  const views = events.filter((event) => event.type === 'view');
  const sessions = new Set(events.map((event) => event.session));

  const bySession = (predicate) => new Set(events.filter(predicate).map((event) => event.session));
  const viewedTrip = bySession((event) => event.type === 'view' && TRIP_PATH.test(event.path));
  const openedBooking = bySession((event) => event.type === 'view' && BOOK_PATH.test(event.path));
  const booked = bySession((event) => event.type === 'booking_done');
  const enquired = bySession((event) => event.type === 'enquiry_done');

  const now = Date.now();
  const series = Array.from({ length: Math.min(days, 30) }, (_, index) => {
    const date = dayKey(now - (Math.min(days, 30) - 1 - index) * DAY_MS);
    const dayEvents = views.filter((event) => dayKey(event.createdAt) === date);
    return { date, views: dayEvents.length, visitors: new Set(dayEvents.map((event) => event.session)).size };
  });

  const pages = new Map();
  const tripViews = new Map();
  const sources = new Map();
  for (const event of views) {
    pages.set(event.path, (pages.get(event.path) ?? 0) + 1);
    const slug = TRIP_PATH.exec(event.path)?.[1];
    if (slug) tripViews.set(slug, (tripViews.get(slug) ?? 0) + 1);
  }
  // A visitor's source is where their first page view came from.
  const firstView = new Map();
  for (const event of [...views].reverse()) if (!firstView.has(event.session)) firstView.set(event.session, event);
  for (const event of firstView.values()) {
    const source = event.referrer || 'Direct';
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  const devices = { mobile: 0, desktop: 0 };
  for (const event of firstView.values()) devices[event.device === 'mobile' ? 'mobile' : 'desktop'] += 1;

  return {
    days,
    visitors: sessions.size,
    pageViews: views.length,
    series,
    topPages: topCounts(pages, 8, (pagePath, count) => ({ path: pagePath, count })),
    topTrips: topCounts(tripViews, 6, (slug, count) => ({ slug, title: tripTitles[slug] ?? slug, count })),
    sources: topCounts(sources, 6, (source, count) => ({ source, count })),
    devices,
    funnel: [
      { step: 'Visited the site', count: sessions.size },
      { step: 'Looked at a trip', count: viewedTrip.size },
      { step: 'Opened the booking page', count: openedBooking.size },
      { step: 'Completed a booking', count: booked.size },
    ],
    enquiries: enquired.size,
  };
}
