import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import TripCard, { TripCardSkeleton } from '../components/TripCard';
import { EmptyState, ErrorState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { DURATIONS, SORTS } from '../utils/filters';
import { CATEGORY_LABELS } from '../utils/format';
import '../styles/Trips.css';

export default function Trips() {
  useDocumentTitle('Trips');
  const [params, setParams] = useSearchParams();
  const trips = useApi('/trips');
  const destinations = useApi('/destinations');

  // The search box keeps its own text so fast typing is never dropped while the router
  // catches up; the URL just mirrors it (see setFilter) so results stay shareable.
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const destination = params.get('destination') ?? '';
  const category = params.get('category') ?? '';
  const duration = params.get('duration') ?? '';
  const sort = params.get('sort') ?? 'popular';

  // Filters live in the URL so results can be shared, bookmarked and survive a refresh.
  const setFilter = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && !(key === 'sort' && value === 'popular')) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const categories = useMemo(() => {
    const present = new Set((trips.data ?? []).map((trip) => trip.category));
    return Object.keys(CATEGORY_LABELS).filter((key) => present.has(key));
  }, [trips.data]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const durationFilter = DURATIONS.find((d) => d.value === duration) ?? DURATIONS[0];
    const sorter = SORTS.find((s) => s.value === sort) ?? SORTS[0];

    return (trips.data ?? [])
      .filter((trip) => !destination || trip.destination === destination)
      .filter((trip) => !category || trip.category === category)
      .filter(durationFilter.test)
      .filter((trip) => !needle || `${trip.title} ${trip.location} ${trip.tagline}`.toLowerCase().includes(needle))
      .sort(sorter.compare);
  }, [trips.data, query, destination, category, duration, sort]);

  const hasFilters = Boolean(query || destination || category || duration);
  const clearFilters = () => {
    setQuery('');
    setParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="All trips" title="Find your next trip" description="Small-group departures across India and abroad, with a trip captain on every one." />

      <section className="section section--tight">
        <div className="container">
          <div className="filters">
            <div className="filters__search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFilter('q', e.target.value);
                }}
                placeholder="Search trips or places, e.g. Ladakh"
                aria-label="Search trips"
              />
            </div>

            <select value={destination} onChange={(e) => setFilter('destination', e.target.value)} aria-label="Destination">
              <option value="">All destinations</option>
              {(destinations.data ?? []).map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>

            <select value={duration} onChange={(e) => setFilter('duration', e.target.value)} aria-label="Duration">
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <select value={sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort by">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="chips" role="group" aria-label="Trip type">
            <button type="button" className={`chip${category === '' ? ' is-active' : ''}`} aria-pressed={category === ''} onClick={() => setFilter('category', '')}>
              All
            </button>
            {categories.map((key) => (
              <button key={key} type="button" className={`chip${category === key ? ' is-active' : ''}`} aria-pressed={category === key} onClick={() => setFilter('category', key)}>
                {CATEGORY_LABELS[key]}
              </button>
            ))}
          </div>

          {trips.error ? (
            <ErrorState message={trips.error.message} onRetry={trips.reload} />
          ) : trips.loading ? (
            <div className="trip-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <TripCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <p className="results-count" aria-live="polite">
                {visible.length} {visible.length === 1 ? 'trip' : 'trips'} found
                {hasFilters && (
                  <button type="button" className="link-button" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </p>

              {visible.length > 0 ? (
                <div className="trip-grid">
                  {visible.map((trip) => (
                    <TripCard key={trip.slug} trip={trip} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No trips match your filters">
                  <p>Try a different destination or duration, or clear the filters to see everything.</p>
                  <button type="button" className="btn btn--primary" onClick={clearFilters}>
                    Clear filters
                  </button>
                </EmptyState>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
