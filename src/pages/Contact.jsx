import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleCheck, Clock, Mail, MapPin, Phone } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import { api } from '../api/client';
import { SITE } from '../config/site';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { focusFirstInvalid } from '../utils/focus';
import { validateContact } from '../utils/validate';
import '../styles/Contact.css';

// The next 12 months, as "Oct 2026"-style labels, for the "when are you travelling" picker.
const TRAVEL_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + i);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
});

const FAQS = [
  {
    q: 'How does booking work?',
    a: 'Pick a trip and departure date and send a booking request. Our team checks availability, confirms your seats and then shares payment details. Nothing is charged when you send the request.',
  },
  {
    q: 'Can I travel solo?',
    a: 'Yes. Most departures are small groups, and many of our travellers join on their own. Your trip captain makes sure everyone feels included.',
  },
  {
    q: 'Are flights included in the price?',
    a: 'Only where the trip’s inclusions say so. Each trip page lists exactly what is and isn’t included, along with a price breakdown.',
  },
  {
    q: 'What about cancellations and refunds?',
    a: 'Cancellation and refund terms are shared with your booking confirmation, before you pay anything.',
  },
  {
    q: 'Can you plan a custom trip for my group?',
    a: 'Absolutely. Tell us your dates, group size and interests in the form and we’ll come back with a tailored itinerary and quote.',
  },
];

export default function Contact() {
  useDocumentTitle('Contact');
  const [params] = useSearchParams();
  const trips = useApi('/trips');
  const formRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tripSlug: params.get('trip') ?? '',
    travelMonth: '',
    travellers: '2',
    // Arriving from an "Ask about this spot" button: start the message for them.
    message: params.get('spot') ? `Hi! I’d like to know about adding ${params.get('spot').slice(0, 80)} to my trip.` : '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [reference, setReference] = useState('');

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateContact(form);
    if (form.message.trim().length < 10) found.message = 'Tell us a little more (at least 10 characters).';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.sendEnquiry({ ...form, travellers: Number.parseInt(form.travellers, 10) });
      setReference(result.reference);
    } catch (err) {
      setErrors(err.fields ?? {});
      setFormError(err.message);
      focusFirstInvalid(formRef.current);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Contact us" title="Plan your trip with us" description="Questions, custom itineraries or group bookings — send us a note and a real person will get back to you." />

      <section className="section">
        <div className="container contact">
          <div className="contact__form-card">
            {reference ? (
              <div className="confirmation confirmation--inline" role="status">
                <CircleCheck aria-hidden="true" />
                <h2>Thanks, we’ve got your enquiry</h2>
                <p>
                  Our team will reply to <strong>{form.email.trim()}</strong> soon. Your reference is <strong className="confirmation__ref">{reference}</strong>.
                </p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <h2>Send an enquiry</h2>

                <div className="form-row">
                  <Field id="name" label="Full name" required autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />
                  <Field id="phone" type="tel" label="Phone / WhatsApp" required autoComplete="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
                </div>
                <Field id="email" type="email" label="Email" required autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />

                <Field as="select" id="tripSlug" label="Interested in" value={form.tripSlug} onChange={update('tripSlug')} error={errors.tripSlug}>
                  <option value="">Not decided yet / custom trip</option>
                  {(trips.data ?? []).map((trip) => (
                    <option key={trip.slug} value={trip.slug}>
                      {trip.title}
                    </option>
                  ))}
                </Field>

                <div className="form-row">
                  <Field as="select" id="travelMonth" label="Travel month" value={form.travelMonth} onChange={update('travelMonth')}>
                    <option value="">Flexible</option>
                    {TRAVEL_MONTHS.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </Field>
                  <Field id="travellers" type="number" min="1" max="50" label="Travellers" value={form.travellers} onChange={update('travellers')} />
                </div>

                <Field
                  as="textarea"
                  id="message"
                  label="Your message"
                  required
                  rows={5}
                  placeholder="Tell us about your dream trip — dates, budget, interests…"
                  value={form.message}
                  onChange={update('message')}
                  error={errors.message}
                />

                {formError && (
                  <p className="form-alert" role="alert">
                    {formError}
                  </p>
                )}

                <button type="submit" className="btn btn--cta btn--lg btn--block" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send enquiry'}
                </button>
              </form>
            )}
          </div>

          <aside className="contact__info" aria-label="Contact details">
            <h2>Talk to us</h2>
            <ul>
              <li>
                <Phone aria-hidden="true" />
                <div>
                  <strong>Call or WhatsApp</strong>
                  <a href={SITE.phoneHref}>{SITE.phone}</a>
                </div>
              </li>
              <li>
                <Mail aria-hidden="true" />
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </div>
              </li>
              <li>
                <MapPin aria-hidden="true" />
                <div>
                  <strong>Office</strong>
                  <span>{SITE.address}</span>
                </div>
              </li>
              <li>
                <Clock aria-hidden="true" />
                <div>
                  <strong>Hours</strong>
                  <span>{SITE.hours}</span>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container faq">
          <h2>Frequently asked questions</h2>
          {FAQS.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
