import { trips, BREAKDOWN_SHARES } from '../data/trips.js';

export const GST_RATE = 0.05;
export const MAX_TRAVELLERS = 10;
const DEPARTURE_COUNT = 8;
const DEPARTURE_GAP_DAYS = 14;
const MIN_LEAD_DAYS = 10;

const SUMMARY_FIELDS = [
  'slug', 'title', 'tagline', 'destination', 'location', 'category', 'price', 'originalPrice',
  'days', 'nights', 'difficulty', 'groupSize', 'bestTime', 'startPoint', 'rating', 'reviewCount',
  'featured', 'badge', 'image',
];

// Deterministic "seats left" so a given departure shows the same number on every request.
function seatsFor(slug, isoDate) {
  let hash = 0;
  for (const ch of `${slug}:${isoDate}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return 2 + (hash % 13);
}

export function buildDepartures(trip, now = new Date()) {
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + MIN_LEAD_DAYS));
  while (cursor.getUTCDay() !== trip.departureWeekday) cursor.setUTCDate(cursor.getUTCDate() + 1);

  const departures = [];
  for (let i = 0; i < DEPARTURE_COUNT; i += 1) {
    const date = cursor.toISOString().slice(0, 10);
    departures.push({ date, seatsLeft: seatsFor(trip.slug, date) });
    cursor.setUTCDate(cursor.getUTCDate() + DEPARTURE_GAP_DAYS);
  }
  return departures;
}

// Splits the per-person price across cost heads; amounts are rounded to ₹50 and the
// last line absorbs the remainder so the lines always add up to the exact price.
export function buildBreakdown(trip) {
  const shares = BREAKDOWN_SHARES[trip.category];
  let allocated = 0;
  return shares.map(([label, percent], index) => {
    const isLast = index === shares.length - 1;
    const amount = isLast ? trip.price - allocated : Math.round((trip.price * percent) / 100 / 50) * 50;
    allocated += amount;
    return { label, amount };
  });
}

export function quote(trip, travellers) {
  const subtotal = trip.price * travellers;
  const gst = Math.round(subtotal * GST_RATE);
  return { pricePerPerson: trip.price, travellers, subtotal, gst, total: subtotal + gst };
}

export function listTrips({ featured, destination, limit } = {}) {
  let result = trips;
  if (featured) result = result.filter((t) => t.featured);
  if (destination) result = result.filter((t) => t.destination === destination);
  if (limit) result = result.slice(0, limit);
  return result.map((trip) => Object.fromEntries(SUMMARY_FIELDS.map((field) => [field, trip[field]])));
}

export function findTrip(slug) {
  return trips.find((trip) => trip.slug === slug);
}

export function tripDetail(trip) {
  const detail = {
    ...trip,
    gstRate: GST_RATE,
    maxTravellers: MAX_TRAVELLERS,
    priceBreakdown: buildBreakdown(trip),
    departures: buildDepartures(trip),
  };
  delete detail.departureWeekday; // internal scheduling detail, not for clients
  return detail;
}
