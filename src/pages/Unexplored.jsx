import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Binoculars, HeartHandshake, Sprout } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import GemCard from '../components/GemCard';
import CtaBanner from '../components/CtaBanner';
import { EmptyState, ErrorState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { GEM_THEMES } from '../utils/format';
import '../styles/Unexplored.css';

const PRINCIPLES = [
  { icon: Sprout, title: 'Nature first', text: 'Each spot is matched to the season, the light and the wildlife, so you go when it is at its best.' },
  { icon: Binoculars, title: 'Expert eyes', text: 'Trip captains, naturalists and local guides share where to look, when to arrive and what to expect.' },
  { icon: HeartHandshake, title: 'Travel gently', text: 'Small groups, local guides and simple rules for each place, so the spot stays special for those who follow.' },
];

export default function Unexplored() {
  useDocumentTitle('Unexplored escapes');
  const [params, setParams] = useSearchParams();
  const gems = useApi('/gems');
  const destinations = useApi('/destinations');

  const theme = params.get('theme') ?? '';
  const destination = params.get('destination') ?? '';

  const setFilter = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const themes = useMemo(() => {
    const present = new Set((gems.data ?? []).map((gem) => gem.theme));
    return Object.keys(GEM_THEMES).filter((key) => present.has(key));
  }, [gems.data]);

  const destinationOptions = useMemo(() => {
    const present = new Set((gems.data ?? []).map((gem) => gem.destination));
    return (destinations.data ?? []).filter((d) => present.has(d.slug));
  }, [gems.data, destinations.data]);

  const visible = (gems.data ?? []).filter((gem) => (!theme || gem.theme === theme) && (!destination || gem.destination === destination));

  return (
    <>
      <PageHeader
        eyebrow="Special · Unexplored escapes"
        title="Offbeat places, seen through nature and expert eyes"
        description="Beyond the usual stops: quiet valleys, sacred forests, dark skies and hidden coves, with the best view, the nature to look for and a tip from someone who knows the place."
      />

      <section className="section section--tight">
        <div className="container">
          <ul className="principles">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="why-card__icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="gem-filters">
            <div className="chips" role="group" aria-label="Type of place">
              <button type="button" className={`chip${theme === '' ? ' is-active' : ''}`} aria-pressed={theme === ''} onClick={() => setFilter('theme', '')}>
                All
              </button>
              {themes.map((key) => (
                <button key={key} type="button" className={`chip${theme === key ? ' is-active' : ''}`} aria-pressed={theme === key} onClick={() => setFilter('theme', key)}>
                  {GEM_THEMES[key]}
                </button>
              ))}
            </div>
            <select value={destination} onChange={(e) => setFilter('destination', e.target.value)} aria-label="Destination">
              <option value="">All destinations</option>
              {destinationOptions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {gems.error ? (
            <ErrorState message={gems.error.message} onRetry={gems.reload} />
          ) : gems.loading ? (
            <div className="gem-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton gem-card--skeleton" />
              ))}
            </div>
          ) : visible.length > 0 ? (
            <>
              <p className="results-count" aria-live="polite">
                {visible.length} {visible.length === 1 ? 'spot' : 'spots'} found
              </p>
              <div className="gem-grid">
                {visible.map((gem) => (
                  <GemCard key={gem.slug} gem={gem} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="No spots match these filters">
              <p>Try another type of place or destination.</p>
              <button type="button" className="btn btn--primary" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            </EmptyState>
          )}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
