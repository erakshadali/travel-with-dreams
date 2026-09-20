import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Clock, MapPin } from 'lucide-react';
import Img from '../components/Img';
import Field from '../components/Field';
import Stepper from '../components/Stepper';
import { ErrorState } from '../components/States';
import NotFound from './NotFound';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDate, formatPrice } from '../utils/format';
import { focusFirstInvalid } from '../utils/focus';
import { validateContact } from '../utils/validate';
import '../styles/Booking.css';

export default function Booking() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { data: trip, error, loading, reload } = useApi(`/trips/${encodeURIComponent(slug)}`);
  useDocumentTitle(trip ? `Book ${trip.title}` : 'Book your trip');

  if (loading) {
    return (
      <div className="container section booking__loading" aria-busy="true">
        <div className="skeleton skeleton--title" style={{ width: '50%' }} />
        <div className="skeleton booking__skeleton" />
      </div>
    );
  }
  if (error?.status === 404) return <NotFound title="Trip not found" message="We couldn’t find the trip you’re trying to book." />;
  if (error) {
    return (
      <div className="container section">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  return <BookingForm key={trip.slug} trip={trip} initialDate={params.get('date')} initialTravellers={Number.parseInt(params.get('travellers'), 10)} />;
}

function BookingForm({ trip, initialDate, initialTravellers }) {
  const formRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    date: trip.departures.some((d) => d.date === initialDate) ? initialDate : trip.departures[0].date,
    travellers: initialTravellers >= 1 ? Math.min(initialTravellers, trip.maxTravellers) : 2,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const departure = trip.departures.find((d) => d.date === form.date);
  const maxTravellers = Math.min(trip.maxTravellers, departure.seatsLeft);
  const count = Math.min(form.travellers, maxTravellers);
  const subtotal = trip.price * count;
  const gst = Math.round(subtotal * trip.gstRate);
  const total = subtotal + gst;

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateContact(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.createBooking({
        tripSlug: trip.slug,
        departureDate: form.date,
        travellers: count,
        name: form.name,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
      });
      setConfirmation(result);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setErrors(err.fields ?? {});
      setFormError(err.message);
      focusFirstInvalid(formRef.current);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <section className="section">
        <div className="container booking__narrow">
          <div className="confirmation" role="status">
            <CircleCheck aria-hidden="true" />
            <h1>Booking request received</h1>
            <p>
              Thank you, {form.name.trim().split(' ')[0]}! Our team will contact you on <strong>{form.email.trim()}</strong> or{' '}
              <strong>{form.phone.trim()}</strong> to confirm availability and share payment details. Nothing has been charged yet.
            </p>

            <dl className="confirmation__details">
              <div>
                <dt>Booking reference</dt>
                <dd className="confirmation__ref">{confirmation.reference}</dd>
              </div>
              <div>
                <dt>Trip</dt>
                <dd>{confirmation.tripTitle}</dd>
              </div>
              <div>
                <dt>Departure</dt>
                <dd>{formatDate(confirmation.departureDate)}</dd>
              </div>
              <div>
                <dt>Travellers</dt>
                <dd>{confirmation.travellers}</dd>
              </div>
              <div>
                <dt>Estimated total (incl. GST)</dt>
                <dd>{formatPrice(confirmation.total)}</dd>
              </div>
            </dl>

            <div className="confirmation__actions">
              <Link to="/trips" className="btn btn--primary">
                Explore more trips
              </Link>
              <Link to="/" className="btn btn--outline">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--tight">
      <div className="container">
        <Link to={`/trips/${trip.slug}`} className="back-link">
          <ArrowLeft aria-hidden="true" />
          Back to trip details
        </Link>
        <h1 className="booking__title">Book {trip.title}</h1>

        <div className="booking">
          <form ref={formRef} className="booking__form" onSubmit={handleSubmit} noValidate>
            <fieldset>
              <legend>1. Your trip</legend>
              <Field
                as="select"
                id="departureDate"
                label="Departure date"
                required
                value={form.date}
                onChange={update('date')}
                error={errors.departureDate}
              >
                {trip.departures.map((d) => (
                  <option key={d.date} value={d.date}>
                    {formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {d.seatsLeft} seats left
                  </option>
                ))}
              </Field>
              <Stepper label="Travellers" value={count} max={maxTravellers} onChange={(value) => setForm((current) => ({ ...current, travellers: value }))} />
              {errors.travellers && (
                <p className="field__error" role="alert">
                  {errors.travellers}
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend>2. Lead traveller details</legend>
              <Field id="name" label="Full name" required autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />
              <div className="form-row">
                <Field id="email" type="email" label="Email" required autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
                <Field id="phone" type="tel" label="Phone / WhatsApp" required autoComplete="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
              </div>
              <Field
                as="textarea"
                id="notes"
                label="Special requests (optional)"
                rows={3}
                hint="Dietary needs, room preferences, celebrations — anything we should know."
                value={form.notes}
                onChange={update('notes')}
              />
            </fieldset>

            {formError && (
              <p className="form-alert" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn btn--cta btn--lg btn--block" disabled={submitting}>
              {submitting ? 'Sending request…' : 'Send booking request'}
            </button>
            <p className="booking__fine-print">No payment is taken now. We’ll confirm seats with you first and share payment details.</p>
          </form>

          <aside className="booking__summary" aria-label="Booking summary">
            <div className="booking__summary-media">
              <Img src={trip.image} alt="" width={800} sizes="(min-width: 960px) 380px, 100vw" />
            </div>
            <div className="booking__summary-body">
              <h2>{trip.title}</h2>
              <p className="booking__summary-meta">
                <span>
                  <MapPin aria-hidden="true" />
                  {trip.location}
                </span>
                <span>
                  <Clock aria-hidden="true" />
                  {trip.days} days / {trip.nights} nights
                </span>
              </p>

              <dl>
                <div>
                  <dt>Departure</dt>
                  <dd>{formatDate(form.date)}</dd>
                </div>
                <div>
                  <dt>
                    {formatPrice(trip.price)} × {count}
                  </dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div>
                  <dt>GST ({Math.round(trip.gstRate * 100)}%)</dt>
                  <dd>{formatPrice(gst)}</dd>
                </div>
                <div className="booking__summary-total">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
