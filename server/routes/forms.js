import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { append } from '../lib/store.js';
import { MAX_TRAVELLERS, buildDepartures, findTrip, quote } from '../lib/tripService.js';
import { clean, isEmail, isPhone, newReference, requireValid } from '../lib/validate.js';

const router = Router();

// Both endpoints write to disk, so keep a single client from flooding them.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a few minutes.' },
});

function contactErrors({ name, email, phone }) {
  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your full name.';
  if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!isPhone(phone)) errors.phone = 'Please enter a valid phone number (10–15 digits).';
  return errors;
}

router.post('/enquiries', limiter, async (req, res) => {
  const body = req.body ?? {};
  const enquiry = {
    name: clean(body.name, 80),
    email: clean(body.email, 120),
    phone: clean(body.phone, 20),
    tripSlug: clean(body.tripSlug, 80),
    travelMonth: clean(body.travelMonth, 40),
    travellers: Number.parseInt(body.travellers, 10) || null,
    message: clean(body.message, 1500),
  };

  const errors = contactErrors(enquiry);
  if (enquiry.tripSlug && !findTrip(enquiry.tripSlug)) errors.tripSlug = 'Please choose a valid trip.';
  if (enquiry.message.length < 10) errors.message = 'Tell us a little more (at least 10 characters).';
  requireValid(errors);

  const saved = await append('enquiries', {
    reference: newReference('ENQ'),
    ...enquiry,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ reference: saved.reference });
});

router.post('/bookings', limiter, async (req, res) => {
  const body = req.body ?? {};
  const trip = findTrip(clean(body.tripSlug, 80));
  const travellers = Number.parseInt(body.travellers, 10);
  const departureDate = clean(body.departureDate, 10);

  const booking = {
    name: clean(body.name, 80),
    email: clean(body.email, 120),
    phone: clean(body.phone, 20),
    notes: clean(body.notes, 1000),
  };

  const errors = contactErrors(booking);
  const departure = trip ? buildDepartures(trip).find((d) => d.date === departureDate) : undefined;
  if (!trip) errors.tripSlug = 'This trip is no longer available.';
  if (trip && !departure) errors.departureDate = 'Please choose one of the available departure dates.';
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > MAX_TRAVELLERS) {
    errors.travellers = `Travellers must be between 1 and ${MAX_TRAVELLERS}.`;
  } else if (departure && travellers > departure.seatsLeft) {
    errors.travellers = `Only ${departure.seatsLeft} seats left on this date.`;
  }
  requireValid(errors);

  // Price is always recalculated here — the client's total is only a preview.
  const pricing = quote(trip, travellers);
  const saved = await append('bookings', {
    reference: newReference('TWD'),
    tripSlug: trip.slug,
    tripTitle: trip.title,
    departureDate,
    ...booking,
    ...pricing,
    status: 'pending-confirmation',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    reference: saved.reference,
    tripTitle: saved.tripTitle,
    departureDate: saved.departureDate,
    ...pricing,
  });
});

export default router;
