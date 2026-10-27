import { CalendarCheck, Clock, MessageSquare, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import { ErrorState } from '../components/States';
import StatusBadge from './StatusBadge';
import { formatDateTime, formatInr, formatShortDay } from './format';
import { useAdminData } from './useAdminData';

function StatCard({ icon: Icon, label, value, children }) {
  return (
    <div className="admin-card stat">
      <span className="stat__icon">
        <Icon aria-hidden="true" />
      </span>
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      <p className="stat__sub">{children}</p>
    </div>
  );
}

// 30 days of bookings and enquiries as paired bars; the totals are repeated in the label for screen readers.
function TrendChart({ series }) {
  const width = 720;
  const height = 180;
  const top = 8;
  const bottom = 26;
  const slot = width / series.length;
  const max = Math.max(1, ...series.flatMap((day) => [day.bookings, day.enquiries]));
  const scale = (count) => ((height - top - bottom) * count) / max;
  const totals = series.reduce((sum, day) => ({ b: sum.b + day.bookings, e: sum.e + day.enquiries }), { b: 0, e: 0 });

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Last 30 days: ${totals.b} bookings and ${totals.e} enquiries`}>
        <line x1="0" x2={width} y1={height - bottom} y2={height - bottom} className="chart__axis" />
        {series.map((day, index) => {
          const x = index * slot;
          return (
            <g key={day.date}>
              <title>{`${formatShortDay(day.date)}: ${day.bookings} bookings, ${day.enquiries} enquiries`}</title>
              <rect x={x + slot * 0.14} width={slot * 0.34} y={height - bottom - scale(day.bookings)} height={scale(day.bookings)} rx="2" className="chart__bar chart__bar--bookings" />
              <rect x={x + slot * 0.52} width={slot * 0.34} y={height - bottom - scale(day.enquiries)} height={scale(day.enquiries)} rx="2" className="chart__bar chart__bar--enquiries" />
              {index % 5 === 0 && (
                <text x={x + slot / 2} y={height - 6} textAnchor="middle" className="chart__label">
                  {formatShortDay(day.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="chart__legend">
        <span><i className="dot dot--bookings" /> Bookings ({totals.b})</span>
        <span><i className="dot dot--enquiries" /> Enquiries ({totals.e})</span>
      </figcaption>
    </figure>
  );
}

export default function Overview() {
  const { data, error, loading, reload } = useAdminData(() => adminApi.stats(), 'stats', { refreshMs: 30000 });

  if (loading && !data) return <p className="admin-muted" role="status">Loading…</p>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { today, week, month, totals, needsAttention, revenue, series, topTrips, latest } = data;
  const waiting = needsAttention.pendingBookings + needsAttention.newEnquiries;

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Good to see you</h1>
        </div>
        {data.storage === 'file' && <p className="admin-note">Local test data (no database connected)</p>}
      </header>

      <section className="stat-grid" aria-label="Key numbers">
        <StatCard icon={CalendarCheck} label="Bookings · 7 days" value={week.bookings}>
          Today {today.bookings} · 30 days {month.bookings} · all time {totals.bookings}
        </StatCard>
        <StatCard icon={MessageSquare} label="Enquiries · 7 days" value={week.enquiries}>
          Today {today.enquiries} · 30 days {month.enquiries} · all time {totals.enquiries}
        </StatCard>
        <StatCard icon={Wallet} label="Confirmed revenue · 30 days" value={formatInr(revenue.confirmedThisMonth)}>
          All time {formatInr(revenue.confirmed)} · incl. GST
        </StatCard>
        <StatCard icon={Clock} label="Waiting for you" value={waiting}>
          {formatInr(revenue.awaitingConfirmation)} in unconfirmed bookings
        </StatCard>
      </section>

      <div className="admin-cols">
        <section className="admin-card" aria-labelledby="trend-title">
          <h2 id="trend-title" className="admin-h2">Last 30 days</h2>
          <TrendChart series={series} />
        </section>

        <section className="admin-card" aria-labelledby="attention-title">
          <h2 id="attention-title" className="admin-h2">Needs attention</h2>
          <ul className="todo">
            <li>
              <Link to="/admin/bookings?status=pending">
                <strong>{needsAttention.pendingBookings}</strong> booking{needsAttention.pendingBookings === 1 ? '' : 's'} to confirm
              </Link>
            </li>
            <li>
              <Link to="/admin/enquiries?status=new">
                <strong>{needsAttention.newEnquiries}</strong> new enquir{needsAttention.newEnquiries === 1 ? 'y' : 'ies'} to answer
              </Link>
            </li>
          </ul>
          <h3 className="admin-h3">Most booked trips</h3>
          {topTrips.length === 0 ? (
            <p className="admin-muted">No bookings yet.</p>
          ) : (
            <ol className="top-trips">
              {topTrips.map((trip) => (
                <li key={trip.tripTitle}>
                  <span>{trip.tripTitle}</span>
                  <strong>{trip.count}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="admin-card" aria-labelledby="latest-title">
        <h2 id="latest-title" className="admin-h2">Latest requests</h2>
        {latest.length === 0 ? (
          <p className="admin-muted">Nothing has come in yet. New bookings and enquiries will show up here.</p>
        ) : (
          <ul className="latest">
            {latest.map((item) => (
              <li key={item.reference}>
                <Link to={`/admin/${item.kind}s?ref=${item.reference}`}>
                  <span className="latest__main">
                    <strong>{item.name}</strong>
                    <span className="admin-muted">
                      {item.kind === 'booking' ? `${item.tripTitle} · ${formatInr(item.total)}` : item.tripSlug || 'General enquiry'}
                    </span>
                  </span>
                  <span className="latest__side">
                    <StatusBadge status={item.status} />
                    <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
