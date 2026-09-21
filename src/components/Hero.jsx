import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import Img from './Img';
import { SITE } from '../config/site';
import { DURATIONS } from '../utils/filters';
import '../styles/Hero.css';

// Each word of the headline flips in on load; `start` staggers the second line after the first.
function FlipWords({ text, start = 0 }) {
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      <span className="flip-word" style={{ '--i': start + i }}>
        {word}
      </span>{' '}
    </Fragment>
  ));
}

export default function Hero({ destinations = [] }) {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const popular = destinations.filter((d) => d.popular).slice(0, 5);
  const showcase = popular.slice(0, 3);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [firstLine, secondLine] = SITE.hero.headline;

  // The 3D photo stack and the site backdrop drift a little with the pointer (mouse devices only).
  // The values live on <html> so both the stack here and the backdrop in index.css can read them.
  useEffect(() => {
    const hero = heroRef.current;
    const root = document.documentElement;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hero || !canHover || reduceMotion) return undefined;

    let frame = 0;
    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = hero.getBoundingClientRect();
        root.style.setProperty('--mx', (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        root.style.setProperty('--my', (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
      });
    };
    const onLeave = () => {
      root.style.setProperty('--mx', '0');
      root.style.setProperty('--my', '0');
    };

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      onLeave();
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (duration) params.set('duration', duration);
    const query = params.toString();
    navigate(query ? `/trips?${query}` : '/trips');
  };

  return (
    <section className="hero" id="home" ref={heroRef}>
      <div className="hero__overlay" />
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__inner">
        <p className="hero__eyebrow">{SITE.hero.eyebrow}</p>
        <h1>
          <span className="hero__line">
            <FlipWords text={firstLine} />
          </span>
          <span className="hero__line hero__line--accent">
            <FlipWords text={secondLine} start={firstLine.split(' ').length} />
          </span>
        </h1>
        <p className="hero__lead">{SITE.hero.lead}</p>

        <form className="hero__search" onSubmit={handleSubmit} role="search" aria-label="Find a trip">
          <label className="hero__field">
            <MapPin aria-hidden="true" />
            <span>
              <span className="hero__label">Destination</span>
              <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="">Anywhere</option>
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="hero__field">
            <CalendarDays aria-hidden="true" />
            <span>
              <span className="hero__label">Duration</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <button type="submit" className="btn btn--cta btn--lg">
            <Search aria-hidden="true" />
            Search trips
          </button>
        </form>

        {/* Always rendered (with reserved height) so the chips arriving from the API don't shift the page. */}
        <p className="hero__popular">
          {popular.length > 0 && (
            <>
              <span>Popular:</span>
              {popular.map((d) => (
                <Link key={d.slug} to={`/trips?destination=${d.slug}`}>
                  {d.name}
                </Link>
              ))}
            </>
          )}
        </p>

        {/* Decorative 3D photo stack (wide screens). Absolutely positioned, so it never moves the layout. */}
        <div className="hero__scene">
          <div className="hero__stack">
            {showcase.map((d, index) => (
              <Link key={d.slug} to={`/trips?destination=${d.slug}`} className={`hero__card hero__card--${index + 1}`}>
                <Img src={d.image} alt="" width={600} sizes="260px" />
                <span className="hero__card-text">
                  <strong>{d.name}</strong>
                  <span>{d.tagline}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
