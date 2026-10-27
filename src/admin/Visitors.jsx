import { Eye, MonitorSmartphone, TrendingUp, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import { EmptyState, ErrorState } from '../components/States';
import { formatShortDay } from './format';
import { useAdminData } from './useAdminData';

const RANGES = [7, 30, 90];

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

// Visitors per day as bars; the total is in the figure label for screen readers.
function VisitorChart({ series }) {
  const width = 720;
  const height = 160;
  const top = 8;
  const bottom = 26;
  const slot = width / series.length;
  const max = Math.max(1, ...series.map((day) => day.visitors));
  const labelEvery = Math.ceil(series.length / 6);
  const total = series.reduce((sum, day) => sum + day.visitors, 0);

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Visitors per day, ${total} visitor-days in total`} preserveAspectRatio="none">
        <line x1="0" x2={width} y1={height - bottom} y2={height - bottom} className="chart__axis" />
        {series.map((day, index) => {
          const barHeight = ((height - top - bottom) * day.visitors) / max;
          return (
            <g key={day.date}>
              <rect x={index * slot + slot * 0.2} width={slot * 0.6} y={height - bottom - barHeight} height={barHeight} rx="2" className="chart__bar chart__bar--bookings">
                <title>{`${formatShortDay(day.date)}: ${day.visitors} visitors, ${day.views} page views`}</title>
              </rect>
              {index % labelEvery === 0 && (
                <text x={index * slot + slot / 2} y={height - 6} textAnchor="middle" className="chart__label">
                  {formatShortDay(day.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

// A ranked list where each row has a bar scaled against the biggest row.
function Ranked({ rows, empty }) {
  if (rows.length === 0) return <p className="admin-muted">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.count));
  return (
    <ol className="ranked">
      {rows.map((row) => (
        <li key={row.key}>
          <span className="ranked__label">{row.label}</span>
          <strong>{row.count}</strong>
          <span className="ranked__bar" style={{ '--share': `${Math.round((row.count / max) * 100)}%` }} aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}

const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '0%');

export default function Visitors() {
  const [params, setParams] = useSearchParams();
  const days = RANGES.includes(Number(params.get('days'))) ? Number(params.get('days')) : 30;
  const { data, error, loading, reload } = useAdminData(() => adminApi.analytics(days), `analytics-${days}`, { refreshMs: 60000 });

  if (loading && !data) return <p className="admin-muted" role="status">Loading…</p>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { visitors, pageViews, series, topPages, topTrips, sources, devices, funnel, enquiries } = data;
  const booked = funnel.at(-1).count;
  const deviceTotal = devices.mobile + devices.desktop;

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="eyebrow">Visitors</p>
          <h1>Who is visiting</h1>
          <p className="admin-muted">Anonymous counts only. No names, IP addresses or cookies are stored, and your own visits are not counted.</p>
        </div>
        <div className="chips" role="group" aria-label="Time range">
          {RANGES.map((range) => (
            <button key={range} type="button" className={`chip${days === range ? ' is-active' : ''}`} aria-pressed={days === range} onClick={() => setParams({ days: String(range) }, { replace: true })}>
              {range} days
            </button>
          ))}
        </div>
      </header>

      {visitors === 0 ? (
        <EmptyState title="No visits recorded yet">
          <p>Visits from the website will show up here. Open the site in another browser (not the one you use for admin) to see the first one.</p>
        </EmptyState>
      ) : (
        <>
          <section className="stat-grid" aria-label="Key numbers">
            <StatCard icon={Users} label={`Visitors · ${days} days`} value={visitors}>People who opened the website</StatCard>
            <StatCard icon={Eye} label="Page views" value={pageViews}>{(pageViews / visitors).toFixed(1)} pages per visitor</StatCard>
            <StatCard icon={TrendingUp} label="Booked" value={booked}>{percent(booked, visitors)} of visitors · {enquiries} sent an enquiry</StatCard>
            <StatCard icon={MonitorSmartphone} label="On a phone" value={percent(devices.mobile, deviceTotal)}>{devices.mobile} phone · {devices.desktop} computer</StatCard>
          </section>

          <div className="admin-cols">
            <section className="admin-card" aria-labelledby="visitors-title">
              <h2 id="visitors-title" className="admin-h2">Visitors per day</h2>
              <VisitorChart series={series} />
            </section>

            <section className="admin-card" aria-labelledby="funnel-title">
              <h2 id="funnel-title" className="admin-h2">From visit to booking</h2>
              <ol className="funnel">
                {funnel.map((step) => (
                  <li key={step.step}>
                    <span>{step.step}</span>
                    <strong>{step.count}</strong>
                    <span className="funnel__bar" style={{ '--share': percent(step.count, funnel[0].count) }} aria-hidden="true" />
                    <span className="admin-muted funnel__pct">{percent(step.count, funnel[0].count)}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="admin-cols admin-cols--even">
            <section className="admin-card" aria-labelledby="trips-title">
              <h2 id="trips-title" className="admin-h2">Most viewed trips</h2>
              <Ranked rows={topTrips.map((trip) => ({ key: trip.slug, label: trip.title, count: trip.count }))} empty="No trip pages viewed yet." />
            </section>
            <section className="admin-card" aria-labelledby="sources-title">
              <h2 id="sources-title" className="admin-h2">Where visitors come from</h2>
              <Ranked rows={sources.map((source) => ({ key: source.source, label: source.source, count: source.count }))} empty="No data yet." />
            </section>
            <section className="admin-card" aria-labelledby="pages-title">
              <h2 id="pages-title" className="admin-h2">Top pages</h2>
              <Ranked rows={topPages.map((page) => ({ key: page.path, label: page.path, count: page.count }))} empty="No data yet." />
            </section>
          </div>
        </>
      )}
    </>
  );
}
