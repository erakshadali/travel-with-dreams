import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Img from './Img';

export default function DestinationCard({ destination }) {
  const { slug, name, tagline, image, tripCount } = destination;

  return (
    <Link to={`/trips?destination=${slug}`} className="destination-card">
      <Img src={image} alt="" width={600} sizes="(min-width: 1000px) 280px, (min-width: 600px) 30vw, 46vw" />
      <span className="destination-card__count">
        {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
      </span>
      <span className="destination-card__text">
        <strong>{name}</strong>
        <span>{tagline}</span>
      </span>
      <ArrowUpRight className="destination-card__arrow" aria-hidden="true" />
    </Link>
  );
}
