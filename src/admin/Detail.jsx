import { useEffect, useRef, useState } from 'react';
import { Mail, MessageCircle, Phone, Save, X } from 'lucide-react';
import { adminApi } from '../api/client';
import { SITE } from '../config/site';
import StatusBadge from './StatusBadge';
import { STATUSES, formatDate, formatDateTime, formatInr, statusLabel, whatsappLink } from './format';

function Row({ label, children }) {
  return (
    <div className="detail__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Side panel with everything about one booking or enquiry, plus the owner's status and private note.
export default function Detail({ item, onClose, onSaved }) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.note);
  const [state, setState] = useState({ busy: false, message: '', error: '' });
  const closeRef = useRef(null);
  const isBooking = item.kind === 'booking';
  const dirty = status !== item.status || note !== item.note;

  // The parent passes a fresh onClose on every render; keep the latest one without re-running the focus logic.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  async function save() {
    setState({ busy: true, message: '', error: '' });
    try {
      const changes = {};
      if (status !== item.status) changes.status = status;
      if (note !== item.note) changes.note = note;
      onSaved(await adminApi.update(item.reference, changes));
      setState({ busy: false, message: 'Saved.', error: '' });
    } catch (failure) {
      setState({ busy: false, message: '', error: failure.message });
    }
  }

  const greeting = isBooking
    ? `Hello ${item.name}, this is ${SITE.name} about your booking ${item.reference} for ${item.tripTitle}.`
    : `Hello ${item.name}, this is ${SITE.name} replying to your enquiry ${item.reference}.`;
  const subject = encodeURIComponent(isBooking ? `Your booking ${item.reference}` : `Your enquiry ${item.reference}`);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="drawer__head">
          <div>
            <p className="eyebrow">{isBooking ? 'Booking' : 'Enquiry'}</p>
            <h2 id="detail-title">{item.reference}</h2>
            <StatusBadge status={item.status} />
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close details" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="drawer__body">
          <div className="contact-actions">
            <a className="btn btn--outline btn--sm" href={`tel:${item.phone}`}><Phone aria-hidden="true" />Call</a>
            <a className="btn btn--outline btn--sm" href={whatsappLink(item.phone, greeting)} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />WhatsApp</a>
            <a className="btn btn--outline btn--sm" href={`mailto:${item.email}?subject=${subject}`}><Mail aria-hidden="true" />Email</a>
          </div>

          <dl className="detail">
            <Row label="Customer">{item.name}</Row>
            <Row label="Phone">{item.phone}</Row>
            <Row label="Email">{item.email}</Row>
            <Row label="Received">{formatDateTime(item.createdAt)}</Row>
            {isBooking ? (
              <>
                <Row label="Trip">{item.tripTitle}</Row>
                <Row label="Departure">{formatDate(item.departureDate)}</Row>
                <Row label="Travellers">{item.travellers}</Row>
                <Row label="Price per person">{formatInr(item.pricePerPerson)}</Row>
                <Row label="GST">{formatInr(item.gst)}</Row>
                <Row label="Total">
                  <strong>{formatInr(item.total)}</strong>
                </Row>
                <Row label="Customer notes">{item.notes || '—'}</Row>
              </>
            ) : (
              <>
                <Row label="Interested in">{item.tripSlug || 'General enquiry'}</Row>
                <Row label="Travel month">{item.travelMonth || '—'}</Row>
                <Row label="Travellers">{item.travellers || '—'}</Row>
                <Row label="Message">{item.message}</Row>
              </>
            )}
          </dl>

          <div className="field">
            <label htmlFor="detail-status">Status</label>
            <select id="detail-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES[item.kind].map((value) => (
                <option key={value} value={value}>{statusLabel(value)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="detail-note">Private note</label>
            <textarea id="detail-note" rows="4" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only you can see this — e.g. called on Monday, wants a window seat." />
            <p className="field__hint">Customers never see notes or status changes.</p>
          </div>

          {state.error && <p className="field__error" role="alert">{state.error}</p>}
          {state.message && !dirty && <p className="admin-saved" role="status">{state.message}</p>}
          <button type="button" className="btn btn--cta btn--block" onClick={save} disabled={!dirty || state.busy}>
            <Save aria-hidden="true" />
            {state.busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </aside>
    </>
  );
}
