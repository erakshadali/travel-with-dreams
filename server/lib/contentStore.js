// Trips, unexplored spots (gems) and testimonials, editable from the admin panel.
//
// The files in server/data are the starting content. On first use they are copied into Postgres
// (content_items), and from then on the database is the source of truth. Storage rules match store.js:
// Postgres when DATABASE_URL is set, JSON files on a developer machine, and the read-only starting
// content on Vercel without a database so the public site never breaks.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { gems } from '../data/gems.js';
import { testimonials } from '../data/testimonials.js';
import { trips } from '../data/trips.js';
import { STORAGE_DIR, getDb } from './store.js';

const SEEDS = { trips, gems, testimonials };
const KEY_FIELD = { trips: 'slug', gems: 'slug', testimonials: 'id' };

export const COLLECTIONS = Object.keys(SEEDS);
export const keyOf = (collection, record) => String(record[KEY_FIELD[collection]]);

const mode = () => (process.env.DATABASE_URL ? 'database' : process.env.VERCEL ? 'seed' : 'file');
const seedCopy = (collection) => structuredClone(SEEDS[collection]);

// Public pages read on every request, so keep a short per-instance cache; writes clear it.
const CACHE_MS = 10_000;
const cache = new Map();

// ---------- Postgres ----------
let schemaReady = null;
const seeded = new Set();

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS content_items (
          collection TEXT NOT NULL,
          key TEXT NOT NULL,
          position INT NOT NULL DEFAULT 0,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (collection, key)
        )`;
      await sql`CREATE TABLE IF NOT EXISTS content_seeded (collection TEXT PRIMARY KEY)`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

// Copies the starting content in once per collection. The marker row means deleting every item later
// does not bring the starting content back.
async function ensureSeeded(collection) {
  await ensureSchema();
  if (seeded.has(collection)) return;
  const sql = getDb();
  const done = await sql`SELECT 1 FROM content_seeded WHERE collection = ${collection}`;
  if (done.length === 0) {
    const rows = SEEDS[collection].map((record, position) => ({ key: keyOf(collection, record), position, data: record }));
    await sql`
      INSERT INTO content_items (collection, key, position, data)
      SELECT ${collection}, e.key, e.position, e.data
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS e(key text, position int, data jsonb)
      ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO content_seeded (collection) VALUES (${collection}) ON CONFLICT DO NOTHING`;
  }
  seeded.add(collection);
}

async function readDatabase(collection) {
  await ensureSeeded(collection);
  const rows = await getDb()`SELECT data FROM content_items WHERE collection = ${collection} ORDER BY position, key`;
  return rows.map((row) => row.data);
}

// ---------- JSON files (development) ----------
const fileFor = (collection) => path.join(STORAGE_DIR, `content-${collection}.json`);

async function readFile(collection) {
  try {
    return JSON.parse(await fs.readFile(fileFor(collection), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return seedCopy(collection);
    throw error;
  }
}

let writeQueue = Promise.resolve();
function writeFile(collection, records) {
  const task = writeQueue.then(async () => {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(fileFor(collection), JSON.stringify(records, null, 2));
  });
  writeQueue = task.catch(() => {});
  return task;
}

// ---------- Public API ----------
// Every record, including unpublished ones. A database hiccup serves the last good copy (or the starting
// content) instead of taking the public site down. The admin panel passes `fresh` so it never shows a
// copy another server instance has already replaced.
export async function listContent(collection, { fresh = false } = {}) {
  const hit = cache.get(collection);
  if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.items;

  try {
    const items = mode() === 'database' ? await readDatabase(collection) : mode() === 'file' ? await readFile(collection) : seedCopy(collection);
    cache.set(collection, { at: Date.now(), items });
    return items;
  } catch (error) {
    console.error(`[content] could not read ${collection}`, error);
    return hit?.items ?? seedCopy(collection);
  }
}

export const isPublished = (record) => record.published !== false;
export const listPublished = async (collection) => (await listContent(collection)).filter(isPublished);

export async function saveContent(collection, record) {
  const key = keyOf(collection, record);
  if (mode() === 'seed') throw new Error('No database is connected, so content cannot be changed.');

  if (mode() === 'database') {
    await ensureSeeded(collection);
    await getDb()`
      INSERT INTO content_items (collection, key, position, data)
      VALUES (${collection}, ${key},
        (SELECT COALESCE(MAX(position), 0) + 1 FROM content_items WHERE collection = ${collection}),
        ${JSON.stringify(record)}::jsonb)
      ON CONFLICT (collection, key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  } else {
    const records = await readFile(collection);
    const index = records.findIndex((item) => keyOf(collection, item) === key);
    if (index === -1) records.push(record);
    else records[index] = record;
    await writeFile(collection, records);
  }
  cache.delete(collection);
  return record;
}

export async function deleteContent(collection, key) {
  if (mode() === 'seed') throw new Error('No database is connected, so content cannot be changed.');

  if (mode() === 'database') {
    await ensureSeeded(collection);
    await getDb()`DELETE FROM content_items WHERE collection = ${collection} AND key = ${key}`;
  } else {
    const records = await readFile(collection);
    await writeFile(collection, records.filter((item) => keyOf(collection, item) !== key));
  }
  cache.delete(collection);
}
