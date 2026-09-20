import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORAGE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'storage');

// Writes are chained so concurrent requests can't read the same file and overwrite each other.
let queue = Promise.resolve();

export function append(collection, record) {
  // Vercel functions have no persistent disk. Until a database or email is connected, the record is
  // written to the function logs (Vercel dashboard -> Logs) so submissions aren't silently lost.
  if (process.env.VERCEL) {
    console.log(`[${collection}] ${JSON.stringify(record)}`);
    return Promise.resolve(record);
  }

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
