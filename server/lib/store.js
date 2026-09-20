import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

// Where enquiries and bookings are saved, in order of preference:
//   1. Postgres (Neon) when DATABASE_URL is set — used in production on Vercel
//   2. Function logs on Vercel without a database, so submissions are not silently lost
//   3. server/storage/*.json on a developer machine
const STORAGE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'storage');

let sql = null;
let tableReady = null;

// Created lazily so the app still starts (and builds) when DATABASE_URL is missing.
function getDb() {
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

function ensureTable() {
  if (!tableReady) {
    tableReady = getDb()`
      CREATE TABLE IF NOT EXISTS submissions (
        id BIGSERIAL PRIMARY KEY,
        kind TEXT NOT NULL,
        reference TEXT NOT NULL UNIQUE,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`.catch((error) => {
      tableReady = null; // retry on the next submission instead of caching the failure
      throw error;
    });
  }
  return tableReady;
}

async function appendToDatabase(collection, record) {
  await ensureTable();
  await getDb()`
    INSERT INTO submissions (kind, reference, data)
    VALUES (${collection}, ${record.reference}, ${JSON.stringify(record)}::jsonb)`;
  return record;
}

// Writes are chained so concurrent requests can't read the same file and overwrite each other.
let queue = Promise.resolve();

function appendToFile(collection, record) {
  const task = queue.then(async () => {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const file = path.join(STORAGE_DIR, `${collection}.json`);

    let records = [];
    try {
      records = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    records.push(record);
    await fs.writeFile(file, JSON.stringify(records, null, 2));
    return record;
  });
  queue = task.catch(() => {});
  return task;
}

export function append(collection, record) {
  if (process.env.DATABASE_URL) return appendToDatabase(collection, record);

  if (process.env.VERCEL) {
    console.log(`[${collection}] ${JSON.stringify(record)}`);
    return Promise.resolve(record);
  }

  return appendToFile(collection, record);
}

// Newest first. Used by scripts/submissions.js so the team can read what came in.
export async function listFromDatabase(kind) {
  await ensureTable();
  const rows = kind
    ? await getDb()`SELECT data, created_at FROM submissions WHERE kind = ${kind} ORDER BY created_at DESC`
    : await getDb()`SELECT data, created_at FROM submissions ORDER BY created_at DESC`;
  return rows;
}
