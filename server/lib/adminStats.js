// Numbers for the admin overview, worked out from the full submission list (a travel agency's volume is small).
const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 30;

// Days are cut at midnight India time, since that is when the team's "today" starts.
export const dayKey = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

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

// One row per person. People are matched on phone number first (last 10 digits, so +91 and spaces do not
// matter) and on email second, because the same customer often fills the booking form and the contact form.
const digits = (phone) => String(phone ?? '').replace(/\D/g, '').slice(-10);

export function computeCustomers(submissions) {
  const customers = [];
  const byPhone = new Map();
  const byEmail = new Map();

  // Oldest first, so a later submission's name and contact details are the ones kept.
  for (const item of [...submissions].reverse()) {
    const phone = digits(item.phone);
    const email = String(item.email ?? '').trim().toLowerCase();
    let customer = (phone.length === 10 && byPhone.get(phone)) || (email && byEmail.get(email));
    if (!customer) {
      customer = { id: phone.length === 10 ? phone : email, history: [] };
      customers.push(customer);
    }
    if (phone.length === 10) byPhone.set(phone, customer);
    if (email) byEmail.set(email, customer);

    customer.name = item.name;
    customer.phone = item.phone;
    customer.email = item.email;
    customer.history.push({
      reference: item.reference,
      kind: item.kind,
      status: item.status,
      createdAt: item.createdAt,
      tripTitle: item.tripTitle || item.tripSlug || '',
      total: item.kind === 'booking' ? Number(item.total) || 0 : 0,
    });
  }

  return customers
    .map((customer) => {
      const history = customer.history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const bookings = history.filter((entry) => entry.kind === 'booking' && entry.status !== 'cancelled');
      return {
        ...customer,
        history,
        bookingCount: bookings.length,
        enquiryCount: history.filter((entry) => entry.kind === 'enquiry').length,
        spent: bookings.filter((entry) => COUNTED_REVENUE.has(entry.status)).reduce((sum, entry) => sum + entry.total, 0),
        firstSeen: history.at(-1).createdAt,
        lastActivity: history[0].createdAt,
        trips: [...new Set(history.map((entry) => entry.tripTitle).filter(Boolean))],
      };
    })
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}
