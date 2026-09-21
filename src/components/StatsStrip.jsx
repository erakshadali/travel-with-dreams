import { useEffect, useRef, useState } from 'react';
import { Compass, MapPinned, MessageSquareText, Star } from 'lucide-react';
import { SITE } from '../config/site';

// Counts up from 0 the first time it scrolls into view. Shows the final number straight away
// for people who prefer reduced motion, and until the element is seen.
function CountUp({ to, decimals = 0, suffix = '' }) {
  const ref = useRef(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined;

    let frame = 0;
    setValue(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const progress = Math.min(Math.max((now - start) / duration, 0), 1); // rAF's clock can be a hair behind performance.now()
          setValue(to * (1 - (1 - progress) ** 3)); // ease-out
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);

  const shown = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN');
  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

// Figures are derived from the catalogue itself, so they can never drift from what is listed.
export default function StatsStrip({ trips, destinations }) {
  const reviews = trips.reduce((sum, trip) => sum + trip.reviewCount, 0);
  const averageRating = trips.reduce((sum, trip) => sum + trip.rating * trip.reviewCount, 0) / reviews;

  const stats = [
    { icon: Compass, value: trips.length, label: 'Curated trips' },
    { icon: MapPinned, value: destinations.length, label: 'Destinations' },
    { icon: MessageSquareText, value: Math.floor(reviews / 100) * 100, suffix: '+', label: 'Traveller reviews' },
    { icon: Star, value: Number(averageRating.toFixed(1)), decimals: 1, label: 'Average rating' },
  ];

  return (
    <section className="stats" aria-label={`${SITE.name} at a glance`}>
      <ul className="container stats__list">
        {stats.map(({ icon: Icon, value, decimals, suffix, label }) => (
          <li key={label}>
            <Icon aria-hidden="true" />
            <strong>
              <CountUp to={value} decimals={decimals} suffix={suffix} />
            </strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
