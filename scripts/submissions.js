// Prints the enquiries and bookings saved in the database, newest first.
//
//   vercel env pull .env.local          (once, to get DATABASE_URL)
//   npm run submissions                 (all)
//   npm run submissions -- bookings     (only bookings; or "enquiries")
import { listFromDatabase } from '../server/lib/store.js';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run `vercel env pull .env.local` first, then `npm run submissions`.');
  process.exit(1);
}

const kind = process.argv[2];
const rows = await listFromDatabase(kind);

if (rows.length === 0) {
  console.log('No submissions yet.');
} else {
  for (const { data, created_at: createdAt } of rows) {
    const when = new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const isBooking = data.reference.startsWith('TWD');
    const detail = isBooking
      ? `${data.tripTitle} · ${data.departureDate} · ${data.travellers} traveller(s) · total ₹${data.total}`
      : `${data.tripSlug || 'general enquiry'} · ${data.message.slice(0, 80)}`;
    console.log(`${data.reference}  ${when}\n  ${data.name} · ${data.email} · ${data.phone}\n  ${detail}\n`);
  }
  console.log(`${rows.length} submission(s)`);
}
