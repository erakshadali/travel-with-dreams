import { Star } from 'lucide-react';

export default function Rating({ value, count, className = '' }) {
  return (
    <span className={`rating ${className}`} aria-label={`Rated ${value.toFixed(1)} out of 5${count != null ? ` from ${count} reviews` : ''}`}>
      <Star aria-hidden="true" fill="currentColor" />
      <strong>{value.toFixed(1)}</strong>
      {count != null && <span className="rating__count">({count})</span>}
    </span>
  );
}
