import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import { EmptyState, ErrorState } from '../components/States';
import Detail from './Detail';
import StatusBadge from './StatusBadge';
import { STATUSES, formatDate, formatDateTime, formatInr, statusLabel } from './format';
import { useAdminData } from './useAdminData';

const COPY = {
  booking: { title: 'Bookings', one: 'booking', empty: 'No bookings yet. They will appear here as soon as someone books a trip.' },
  enquiry: { title: 'Enquiries', one: 'enquiry', empty: 'No enquiries yet. Messages from the contact form and trip pages will appear here.' },
};

export default function Submissions({ kind }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const selected = params.get('ref') ?? '';
  const [search, setSearch] = useState(q);
  const copy = COPY[kind];

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

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    if (search === q) return undefined;
    const timer = setTimeout(() => setParam({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filters = { kind, status, q, from, to };
  const { data, error, loading, reload, setData } = useAdminData(() => adminApi.submissions(filters), JSON.stringify(filters));
  const items = data?.items ?? [];
  const current = items.find((item) => item.reference === selected);
  const filtering = Boolean(status || q || from || to);

  const saved = (updated) => setData({ ...data, items: items.map((item) => (item.reference === updated.reference ? updated : item)) });

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="eyebrow">{copy.title}</p>
          <h1>{copy.title}</h1>
        </div>
        <a className="btn btn--outline btn--sm" href={adminApi.exportUrl(filters)} download>
          <Download aria-hidden="true" />
          Export CSV
        </a>
      </header>

      <form className="admin-card filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field filters__search">
          <label htmlFor="q" className="sr-only">Search {copy.title.toLowerCase()}</label>
          <Search aria-hidden="true" />
          <input id="q" type="search" placeholder="Search name, phone, email, trip, reference" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(event) => setParam({ status: event.target.value })}>
            <option value="">All statuses</option>
            {STATUSES[kind].map((value) => (
              <option key={value} value={value}>{statusLabel(value)}</option>
            ))}
          </select>
        </div>
        <div className="field filters__date">
          <label htmlFor="from">Received from</label>
          <input id="from" type="date" value={from} max={to || undefined} onChange={(event) => setParam({ from: event.target.value })} />
        </div>
        <div className="field filters__date">
          <label htmlFor="to">Received until</label>
          <input id="to" type="date" value={to} min={from || undefined} onChange={(event) => setParam({ to: event.target.value })} />
        </div>
        {filtering && (
          <button type="button" className="btn btn--outline btn--sm" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>
            Clear filters
          </button>
        )}
      </form>

      {loading && !data && <p className="admin-muted" role="status">Loading…</p>}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && items.length === 0 && (
        <EmptyState title={filtering ? 'Nothing matches these filters' : `No ${copy.title.toLowerCase()} yet`}>
          <p>{filtering ? 'Try a different search or clear the filters.' : copy.empty}</p>
        </EmptyState>
      )}

      {items.length > 0 && (
        <div className="admin-card table-wrap">
          <p className="table-count" role="status">{data.total} {copy.one}{data.total === 1 ? '' : 's'}</p>
          <table className="admin-table">
            <thead>
              {kind === 'booking' ? (
                <tr><th>Booking</th><th>Customer</th><th>Trip</th><th>Amount</th><th>Status</th></tr>
              ) : (
                <tr><th>Enquiry</th><th>Customer</th><th>Interested in</th><th>Message</th><th>Status</th></tr>
              )}
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.reference} className={item.reference === selected ? 'is-selected' : undefined} onClick={() => setParam({ ref: item.reference }, { replace: false })}>
                  <td data-label={copy.title.slice(0, -1)}>
                    <div className="cell-body">
                      <button type="button" className="link-btn" onClick={(event) => { event.stopPropagation(); setParam({ ref: item.reference }, { replace: false }); }}>
                        {item.reference}
                      </button>
                      <span className="cell-sub">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </td>
                  <td data-label="Customer">
                    <div className="cell-body">
                      <strong>{item.name}</strong>
                      <span className="cell-sub">{item.phone}</span>
                    </div>
                  </td>
                  {kind === 'booking' ? (
                    <>
                      <td data-label="Trip">
                        <div className="cell-body">
                          {item.tripTitle}
                          <span className="cell-sub">{formatDate(item.departureDate)} · {item.travellers} traveller{item.travellers === 1 ? '' : 's'}</span>
                        </div>
                      </td>
                      <td data-label="Amount">{formatInr(item.total)}</td>
                    </>
                  ) : (
                    <>
                      <td data-label="Interested in">{item.tripSlug || 'General enquiry'}</td>
                      <td data-label="Message" className="cell-clip">{item.message}</td>
                    </>
                  )}
                  <td data-label="Status"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {current && <Detail key={current.reference} item={current} onClose={() => setParam({ ref: '' }, { replace: false })} onSaved={saved} />}
    </>
  );
}
