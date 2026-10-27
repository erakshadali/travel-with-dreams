import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import { SITE } from '../config/site';
import { EmptyState, ErrorState } from '../components/States';
import Drawer from './Drawer';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime, formatInr, whatsappLink } from './format';
import { useAdminData } from './useAdminData';

function Row({ label, children }) {
  return (
    <div className="detail__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function CustomerDetail({ customer, onClose }) {
  const greeting = `Hello ${customer.name}, this is ${SITE.name}.`;
  return (
    <Drawer eyebrow="Customer" title={customer.name} onClose={onClose}>
      <div className="contact-actions">
        <a className="btn btn--outline btn--sm" href={`tel:${customer.phone}`}><Phone aria-hidden="true" />Call</a>
        <a className="btn btn--outline btn--sm" href={whatsappLink(customer.phone, greeting)} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />WhatsApp</a>
        <a className="btn btn--outline btn--sm" href={`mailto:${customer.email}`}><Mail aria-hidden="true" />Email</a>
      </div>

      <dl className="detail">
        <Row label="Phone">{customer.phone}</Row>
        <Row label="Email">{customer.email}</Row>
        <Row label="First contact">{formatDate(customer.firstSeen)}</Row>
        <Row label="Bookings">{customer.bookingCount}</Row>
        <Row label="Enquiries">{customer.enquiryCount}</Row>
        <Row label="Confirmed spend"><strong>{formatInr(customer.spent)}</strong></Row>
      </dl>

      <h3 className="admin-h3">History</h3>
      <ul className="history">
        {customer.history.map((entry) => (
          <li key={entry.reference}>
            <div>
              <Link to={`/admin/${entry.kind}s?ref=${entry.reference}`}>{entry.reference}</Link>
              <p className="admin-muted">
                {entry.kind === 'booking' ? 'Booking' : 'Enquiry'}
                {entry.tripTitle ? ` · ${entry.tripTitle}` : ''}
                {entry.total ? ` · ${formatInr(entry.total)}` : ''}
              </p>
              <p className="admin-muted">{formatDateTime(entry.createdAt)}</p>
            </div>
            <StatusBadge status={entry.status} />
          </li>
        ))}
      </ul>
    </Drawer>
  );
}

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const filter = params.get('filter') ?? '';
  const selected = params.get('id') ?? '';
  const [search, setSearch] = useState(q);

  const setParam = (changes, { replace = true } = {}) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace },
    );

  useEffect(() => {
    if (search === q) return undefined;
    const timer = setTimeout(() => setParam({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filters = { q, filter };
  const { data, error, loading, reload } = useAdminData(() => adminApi.customers(filters), JSON.stringify(filters), { refreshMs: 30000 });
  const items = data?.items ?? [];
  const current = items.find((item) => item.id === selected);

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="eyebrow">Customers</p>
          <h1>Customers</h1>
          <p className="admin-muted">Everyone who has booked or enquired, with their history in one place.</p>
        </div>
      </header>

      <form className="admin-card filters filters--short" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field filters__search">
          <label htmlFor="q" className="sr-only">Search customers</label>
          <Search aria-hidden="true" />
          <input id="q" type="search" placeholder="Search name, phone, email, trip" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="filter">Show</label>
          <select id="filter" value={filter} onChange={(event) => setParam({ filter: event.target.value })}>
            <option value="">All customers</option>
            <option value="repeat">Repeat customers</option>
          </select>
        </div>
      </form>

      {loading && !data && <p className="admin-muted" role="status">Loading…</p>}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && items.length === 0 && (
        <EmptyState title={q || filter ? 'No customers match' : 'No customers yet'}>
          <p>{q || filter ? 'Try a different search.' : 'People appear here as soon as they book a trip or send an enquiry.'}</p>
        </EmptyState>
      )}

      {items.length > 0 && (
        <div className="admin-card table-wrap">
          <p className="table-count" role="status">{data.total} customer{data.total === 1 ? '' : 's'}</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Bookings</th>
                <th>Enquiries</th>
                <th>Confirmed spend</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => (
                <tr key={customer.id} className={customer.id === selected ? 'is-selected' : undefined} onClick={() => setParam({ id: customer.id }, { replace: false })}>
                  <td data-label="Customer">
                    <div className="cell-body">
                      <button type="button" className="link-btn" onClick={(event) => { event.stopPropagation(); setParam({ id: customer.id }, { replace: false }); }}>
                        {customer.name}
                      </button>
                      <span className="cell-sub">{customer.phone}</span>
                    </div>
                  </td>
                  <td data-label="Bookings">{customer.bookingCount}</td>
                  <td data-label="Enquiries">{customer.enquiryCount}</td>
                  <td data-label="Confirmed spend">{formatInr(customer.spent)}</td>
                  <td data-label="Last activity">{formatDateTime(customer.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {current && <CustomerDetail key={current.id} customer={current} onClose={() => setParam({ id: '' }, { replace: false })} />}
    </>
  );
}
