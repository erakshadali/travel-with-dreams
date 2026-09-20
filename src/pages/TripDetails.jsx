import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Check, ChevronRight, Clock, Gauge, MapPin, Users, X } from 'lucide-react';
import Gallery from '../components/trip/Gallery';
import Itinerary from '../components/trip/Itinerary';
import BookingCard from '../components/trip/BookingCard';
import Rating from '../components/Rating';
import SectionHeading from '../components/SectionHeading';
import TripCard from '../components/TripCard';
import GemCard from '../components/GemCard';
import { ErrorState } from '../components/States';
import NotFound from './NotFound';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CATEGORY_LABELS, formatPrice } from '../utils/format';
import '../styles/TripDetails.css';

function DetailsSkeleton() {
  return (
    <div className="container details details--loading" aria-busy="true" aria-label="Loading trip">
      <div className="skeleton skeleton--title" style={{ width: '60%' }} />
      <div className="skeleton details__skeleton-gallery" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line" style={{ width: '80%' }} />
    </div>
  );
}

export default function TripDetails() {
  const { slug } = useParams();
  const { data: trip, error, loading, reload } = useApi(`/trips/${encodeURIComponent(slug)}`);
  const allTrips = useApi('/trips');
  const nearbyGems = useApi(`/gems?trip=${encodeURIComponent(slug)}`);
  useDocumentTitle(trip?.title ?? 'Trip details');

  if (loading) return <DetailsSkeleton />;
  if (error?.status === 404) {
    return <NotFound title="Trip not found" message="This trip may have been removed or the link is incorrect. Have a look at our other trips." />;
  }
  if (error) {
    return (
      <div className="container section">
        <ErrorState message={error.message} onRetry={reload} />
      </div>
    );
  }

  const images = [trip.image, ...trip.gallery];
  const gems = nearbyGems.data ?? [];
  const related = (allTrips.data ?? [])
    .filter((other) => other.slug !== trip.slug)
    .sort((a, b) => Number(b.category === trip.category) - Number(a.category === trip.category) || b.reviewCount - a.reviewCount)
    .slice(0, 3);

  const facts = [
    { icon: Clock, label: 'Duration', value: `${trip.days} days / ${trip.nights} nights` },
    { icon: Users, label: 'Group size', value: trip.groupSize },
    { icon: Gauge, label: 'Difficulty', value: trip.difficulty },
    { icon: CalendarDays, label: 'Best time', value: trip.bestTime },
    { icon: MapPin, label: 'Starts from', value: trip.startPoint },
  ];

  return (
    <article className="details">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight aria-hidden="true" />
          <Link to="/trips">Trips</Link>
          <ChevronRight aria-hidden="true" />
          <span aria-current="page">{trip.title}</span>
        </nav>

        <header className="details__header">
          <div>
            <div className="details__tags">
              <span className="tag">{CATEGORY_LABELS[trip.category]}</span>
              {trip.badge && <span className="tag tag--accent">{trip.badge}</span>}
            </div>
            <h1>{trip.title}</h1>
            <p className="details__tagline">{trip.tagline}</p>
          </div>
          <div className="details__meta">
            <Rating value={trip.rating} count={trip.reviewCount} />
            <span>
              <MapPin aria-hidden="true" />
              {trip.location}
            </span>
          </div>
        </header>

        <Gallery images={images} title={trip.title} />

        <div className="details__layout">
          <div className="details__main">
            <nav className="trip-tabs" aria-label="Trip sections">
              <a href="#overview">Overview</a>
              <a href="#itinerary">Itinerary</a>
              <a href="#inclusions">Inclusions</a>
              <a href="#pricing">Price</a>
              {gems.length > 0 && <a href="#unexplored">Unexplored</a>}
            </nav>

            <section id="overview" className="details__section">
              <ul className="facts">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label}>
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </li>
                ))}
              </ul>

              <h2>About this trip</h2>
              <p>{trip.overview}</p>

              <h3>Trip highlights</h3>
              <ul className="check-list">
                {trip.highlights.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="itinerary" className="details__section">
              <h2>Day-by-day itinerary</h2>
              <Itinerary days={trip.itinerary} />
            </section>

            <section id="inclusions" className="details__section">
              <h2>What’s included</h2>
              <div className="inc-exc">
                <div className="inc-exc__col inc-exc__col--in">
                  <h3>Inclusions</h3>
                  <ul>
                    {trip.inclusions.map((item) => (
                      <li key={item}>
                        <Check aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="inc-exc__col inc-exc__col--out">
                  <h3>Exclusions</h3>
                  <ul>
                    {trip.exclusions.map((item) => (
                      <li key={item}>
                        <X aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="pricing" className="details__section">
              <h2>Price breakdown</h2>
              <p className="details__muted">Where your {formatPrice(trip.price)} per person goes:</p>
              <table className="price-table">
                <caption className="sr-only">Price per person for {trip.title}</caption>
                <tbody>
                  {trip.priceBreakdown.map(({ label, amount }) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{formatPrice(amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Price per person</th>
                    <td>{formatPrice(trip.price)}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="details__muted">GST ({Math.round(trip.gstRate * 100)}%) is added on the total when you book. Flights and other exclusions above are not part of this price.</p>
            </section>

            {gems.length > 0 && (
              <section id="unexplored" className="details__section">
                <h2>Unexplored spots near this trip</h2>
                <p className="details__muted">
                  Offbeat places close to this route, with the best view and an expert tip for each. They are not part of the itinerary above, but you can ask us about adding one.
                </p>
                <div className="gem-grid gem-grid--compact">
                  {gems.map((gem) => (
                    <GemCard key={gem.slug} gem={gem} compact />
                  ))}
                </div>
              </section>
            )}
          </div>

          <BookingCard trip={trip} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <SectionHeading eyebrow="Keep exploring" title="You may also like" />
            <div className="trip-grid">
              {related.map((other) => (
                <TripCard key={other.slug} trip={other} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mobile-bar">
        <div>
          <small>From</small>
          <strong>{formatPrice(trip.price)}</strong>
        </div>
        <a href="#booking" className="btn btn--cta">
          Book now
        </a>
      </div>
    </article>
  );
}
