import { Compass, MapPinned, MessageSquareText, Star } from 'lucide-react';

// Figures are derived from the catalogue itself, so they can never drift from what is listed.
export default function StatsStrip({ trips, destinations }) {
  const reviews = trips.reduce((sum, trip) => sum + trip.reviewCount, 0);
  const averageRating = trips.reduce((sum, trip) => sum + trip.rating * trip.reviewCount, 0) / reviews;

  const stats = [
    { icon: Compass, value: `${trips.length}`, label: 'Curated trips' },
    { icon: MapPinned, value: `${destinations.length}`, label: 'Destinations' },
    { icon: MessageSquareText, value: `${(Math.floor(reviews / 100) * 100).toLocaleString('en-IN')}+`, label: 'Traveller reviews' },
    { icon: Star, value: averageRating.toFixed(1), label: 'Average rating' },
  ];

  return (
    <section className="stats" aria-label="Travel With Dreams at a glance">
      <ul className="container stats__list">
        {stats.map(({ icon: Icon, value, label }) => (
          <li key={label}>
            <Icon aria-hidden="true" />
            <strong>{value}</strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
