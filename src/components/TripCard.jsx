import { Link } from 'react-router-dom';
import { Clock, Gauge, MapPin, Users } from 'lucide-react';
import Img from './Img';
import Rating from './Rating';
import { discountPercent, formatPrice } from '../utils/format';
import '../styles/TripCard.css';

export default function TripCard({ trip }) {
  const off = discountPercent(trip.price, trip.originalPrice);

  return (
    <article className="trip-card">
      <Link to={`/trips/${trip.slug}`} className="trip-card__media" aria-hidden="true" tabIndex={-1}>
        <Img src={trip.image} alt="" width={800} sizes="(min-width: 1100px) 380px, (min-width: 700px) 45vw, 100vw" />
        {trip.badge && <span className="trip-card__badge">{trip.badge}</span>}
        <Rating value={trip.rating} count={trip.reviewCount} className="trip-card__rating" />
      </Link>

      <div className="trip-card__body">
        <p className="trip-card__location">
          <MapPin aria-hidden="true" />
          {trip.location}
        </p>
        <h3 className="trip-card__title">
          <Link to={`/trips/${trip.slug}`}>{trip.title}</Link>
        </h3>
        <p className="trip-card__tagline">{trip.tagline}</p>

        <ul className="trip-card__meta">
          <li>
            <Clock aria-hidden="true" />
            {trip.days}D / {trip.nights}N
          </li>
          <li>
            <Users aria-hidden="true" />
            {trip.groupSize}
          </li>
          <li>
            <Gauge aria-hidden="true" />
            {trip.difficulty}
          </li>
        </ul>

        <div className="trip-card__footer">
          <div className="trip-card__price">
            <span className="trip-card__from">From</span>
            <strong>{formatPrice(trip.price)}</strong>
            {off > 0 && (
              <>
                {' '}
                <s>{formatPrice(trip.originalPrice)}</s>
              </>
            )}
            <small>per person</small>
          </div>
          <Link to={`/book/${trip.slug}`} className="btn btn--cta btn--sm">
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="trip-card trip-card--skeleton" aria-hidden="true">
      <div className="trip-card__media skeleton" />
      <div className="trip-card__body">
        <div className="skeleton skeleton--line" style={{ width: '40%' }} />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line" style={{ width: '70%' }} />
        <div className="skeleton skeleton--footer" />
      </div>
    </div>
  );
}
