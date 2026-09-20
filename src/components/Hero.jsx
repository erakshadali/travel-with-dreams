import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import Img from './Img';
import { DURATIONS } from '../utils/filters';
import '../styles/Hero.css';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';

export default function Hero({ destinations = [] }) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (duration) params.set('duration', duration);
    const query = params.toString();
    navigate(query ? `/trips?${query}` : '/trips');
  };

  return (
    <section className="hero" id="home">
      <Img className="hero__bg" src={HERO_IMAGE} alt="" width={1600} sizes="100vw" eager />
      <div className="hero__overlay" />

      <div className="container hero__inner">
        <p className="hero__eyebrow">Small-group trips across India &amp; beyond</p>
        <h1>
          Travel with dreams.
          <br />
          <span>Return with stories.</span>
        </h1>
        <p className="hero__lead">
          Hand-crafted journeys to the Himalayas, beaches, palaces and backwaters — with expert trip captains, real stays and pricing you can
          see line by line.
        </p>

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

        {destinations.length > 0 && (
          <p className="hero__popular">
            <span>Popular:</span>
            {destinations
              .filter((d) => d.popular)
              .slice(0, 5)
              .map((d) => (
                <Link key={d.slug} to={`/trips?destination=${d.slug}`}>
                  {d.name}
                </Link>
              ))}
          </p>
        )}
      </div>
    </section>
  );
}
