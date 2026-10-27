// What the admin panel reads and changes: the bookings and enquiries saved by store.js, plus the owner's
// status/notes on each one and a log of every change.
//
// Same storage rules as store.js: Postgres when DATABASE_URL is set, JSON files on a developer machine,
// and nothing on Vercel without a database (the panel then says so instead of showing an empty list).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { STORAGE_DIR, ensureTable, getDb } from './store.js';

export const STATUSES = {
  booking: ['pending', 'confirmed', 'paid', 'completed', 'cancelled'],
  enquiry: ['new', 'contacted', 'converted', 'closed'],
};

export const storageMode = () => (process.env.DATABASE_URL ? 'database' : process.env.VERCEL ? 'none' : 'file');

const kindOf = (collection) => (collection === 'bookings' ? 'booking' : 'enquiry');

function normalize(collection, data, createdAt, meta = {}) {
  const kind = kindOf(collection);
  return {
    ...data,
    kind,
    createdAt: new Date(createdAt).toISOString(),
    status: meta.status || STATUSES[kind][0],
    note: meta.note || '',
    updatedAt: meta.updatedAt ? new Date(meta.updatedAt).toISOString() : null,
  };
}

// ---------- Postgres ----------
let schemaReady = null;

function ensureAdminSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureTable();
      const sql = getDb();
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS admin_note TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ`;
      await sql`
        CREATE TABLE IF NOT EXISTS activity_log (
          id BIGSERIAL PRIMARY KEY,
          action TEXT NOT NULL,
          reference TEXT,
          detail JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function listFromDb() {
  await ensureAdminSchema();
  const rows = await getDb()`
    SELECT kind, data, created_at, status, admin_note, updated_at FROM submissions ORDER BY created_at DESC`;
  return rows.map((row) =>
    normalize(row.kind, row.data, row.created_at, { status: row.status, note: row.admin_note, updatedAt: row.updated_at }),
  );
}

// ---------- JSON files (development) ----------
const readJson = async (name, fallback) => {
  try {
    return JSON.parse(await fs.readFile(path.join(STORAGE_DIR, name), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
};

let writeQueue = Promise.resolve();
const writeJson = (name, value) => {
  const task = writeQueue.then(async () => {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(path.join(STORAGE_DIR, name), JSON.stringify(value, null, 2));
  });
  writeQueue = task.catch(() => {});
  return task;
};

async function listFromFiles() {
  const [bookings, enquiries, metaByReference] = await Promise.all([
    readJson('bookings.json', []),
    readJson('enquiries.json', []),
    readJson('admin-meta.json', {}),
  ]);
  return [
    ...bookings.map((record) => normalize('bookings', record, record.createdAt, metaByReference[record.reference])),
    ...enquiries.map((record) => normalize('enquiries', record, record.createdAt, metaByReference[record.reference])),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------- Public API ----------
export const listSubmissions = () => (storageMode() === 'database' ? listFromDb() : listFromFiles());

async function logActivity(action, reference, detail) {
  if (storageMode() === 'database') {
    await getDb()`INSERT INTO activity_log (action, reference, detail) VALUES (${action}, ${reference}, ${JSON.stringify(detail)}::jsonb)`;
    return;
  }
  const log = await readJson('activity.json', []);
  log.unshift({ action, reference, detail, createdAt: new Date().toISOString() });
  await writeJson('activity.json', log.slice(0, 1000));
}

export async function listActivity(limit = 100) {
  if (storageMode() === 'database') {
    await ensureAdminSchema();
    const rows = await getDb()`
      SELECT action, reference, detail, created_at FROM activity_log ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map((row) => ({
      action: row.action,
      reference: row.reference,
      detail: row.detail,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }
  return (await readJson('activity.json', [])).slice(0, limit);
}

// Returns the updated record, or null when the reference does not exist.
export async function updateSubmission(reference, { status, note }) {
  const current = (await listSubmissions()).find((item) => item.reference === reference);
  if (!current) return null;

  const next = { status: status ?? current.status, note: note ?? current.note, updatedAt: new Date().toISOString() };

  if (storageMode() === 'database') {
    await getDb()`
      UPDATE submissions SET status = ${next.status}, admin_note = ${next.note}, updated_at = now()
      WHERE reference = ${reference}`;
  } else {
    const meta = await readJson('admin-meta.json', {});
    meta[reference] = next;
    await writeJson('admin-meta.json', meta);
  }

  if (next.status !== current.status) {
    await logActivity('status_changed', reference, { kind: current.kind, name: current.name, from: current.status, to: next.status });
  }
  if (next.note !== current.note) {
    await logActivity('note_updated', reference, { kind: current.kind, name: current.name });
  }
  return { ...current, ...next };
}
