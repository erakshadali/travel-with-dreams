// Numbers for the admin overview, worked out from the full submission list (a travel agency's volume is small).
const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 30;

// Days are cut at midnight India time, since that is when the team's "today" starts.
const dayKey = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const COUNTED_REVENUE = new Set(['confirmed', 'paid', 'completed']);

export function computeStats(submissions, now = Date.now()) {
  const bookings = submissions.filter((item) => item.kind === 'booking');
  const enquiries = submissions.filter((item) => item.kind === 'enquiry');

  const withinDays = (items, days) => items.filter((item) => now - new Date(item.createdAt).getTime() < days * DAY_MS).length;
  const sameDay = (items) => items.filter((item) => dayKey(item.createdAt) === dayKey(now)).length;
  const period = (days) => ({ bookings: withinDays(bookings, days), enquiries: withinDays(enquiries, days) });

  const series = Array.from({ length: SERIES_DAYS }, (_, index) => {
    const date = dayKey(now - (SERIES_DAYS - 1 - index) * DAY_MS);
    return {
      date,
      bookings: bookings.filter((item) => dayKey(item.createdAt) === date).length,
      enquiries: enquiries.filter((item) => dayKey(item.createdAt) === date).length,
    };
  });

  const sum = (items) => items.reduce((total, item) => total + (Number(item.total) || 0), 0);
  const confirmed = bookings.filter((item) => COUNTED_REVENUE.has(item.status));

  const tripCounts = new Map();
  for (const item of bookings) {
    if (item.status === 'cancelled') continue;
    tripCounts.set(item.tripTitle, (tripCounts.get(item.tripTitle) ?? 0) + 1);
  }

  return {
    today: { bookings: sameDay(bookings), enquiries: sameDay(enquiries) },
    week: period(7),
    month: period(30),
    totals: { bookings: bookings.length, enquiries: enquiries.length },
    needsAttention: {
      pendingBookings: bookings.filter((item) => item.status === 'pending').length,
      newEnquiries: enquiries.filter((item) => item.status === 'new').length,
    },
    revenue: {
      confirmed: sum(confirmed),
      confirmedThisMonth: sum(confirmed.filter((item) => now - new Date(item.createdAt).getTime() < 30 * DAY_MS)),
      awaitingConfirmation: sum(bookings.filter((item) => item.status === 'pending')),
    },
    series,
    topTrips: [...tripCounts].map(([tripTitle, count]) => ({ tripTitle, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    latest: submissions.slice(0, 6),
  };
}
