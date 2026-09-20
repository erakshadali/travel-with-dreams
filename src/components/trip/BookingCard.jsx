import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ShieldCheck } from 'lucide-react';
import Stepper from '../Stepper';
import { discountPercent, formatDate, formatPrice } from '../../utils/format';

export default function BookingCard({ trip }) {
  const [date, setDate] = useState(trip.departures[0].date);
  const [travellers, setTravellers] = useState(2);

  const departure = trip.departures.find((d) => d.date === date);
  const maxTravellers = Math.min(trip.maxTravellers, departure.seatsLeft);
  // Changing to a date with fewer seats should never leave an impossible headcount selected.
  const count = Math.min(travellers, maxTravellers);

  const subtotal = trip.price * count;
  const gst = Math.round(subtotal * trip.gstRate);
  const off = discountPercent(trip.price, trip.originalPrice);

  return (
    <aside className="booking-card" id="booking" aria-label="Book this trip">
      <div className="booking-card__price">
        <span>From</span>
        <strong>{formatPrice(trip.price)}</strong>
        {off > 0 && <s>{formatPrice(trip.originalPrice)}</s>}
        {off > 0 && <span className="booking-card__save">Save {off}%</span>}
        <small>per person, taxes extra</small>
      </div>

      <div className="field">
        <label htmlFor="departure">
          <CalendarDays aria-hidden="true" /> Departure date
        </label>
        <select id="departure" value={date} onChange={(e) => setDate(e.target.value)}>
          {trip.departures.map((d) => (
            <option key={d.date} value={d.date}>
              {formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {d.seatsLeft} seats left
            </option>
          ))}
        </select>
      </div>

      <Stepper label="Travellers" value={count} max={maxTravellers} onChange={setTravellers} />

      <dl className="booking-card__summary">
        <div>
          <dt>
            {formatPrice(trip.price)} × {count} {count === 1 ? 'traveller' : 'travellers'}
          </dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div>
          <dt>GST ({Math.round(trip.gstRate * 100)}%)</dt>
          <dd>{formatPrice(gst)}</dd>
        </div>
        <div className="booking-card__total">
          <dt>Total</dt>
          <dd>{formatPrice(subtotal + gst)}</dd>
        </div>
      </dl>

      <Link to={`/book/${trip.slug}?date=${date}&travellers=${count}`} className="btn btn--cta btn--lg btn--block">
        Book now
      </Link>
      <Link to={`/contact?trip=${trip.slug}`} className="btn btn--outline btn--block">
        Ask a question
      </Link>

      <p className="booking-card__note">
        <ShieldCheck aria-hidden="true" />
        No payment now. Our team confirms availability with you first.
      </p>
    </aside>
  );
}
