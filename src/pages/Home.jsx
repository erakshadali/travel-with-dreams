import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../components/Hero';
import StatsStrip from '../components/StatsStrip';
import SectionHeading from '../components/SectionHeading';
import DestinationCard from '../components/DestinationCard';
import TripCard, { TripCardSkeleton } from '../components/TripCard';
import GemCard from '../components/GemCard';
import WhyUs from '../components/WhyUs';
import Testimonials from '../components/Testimonials';
import CtaBanner from '../components/CtaBanner';
import { ErrorState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Home() {
  useDocumentTitle();
  const trips = useApi('/trips');
  const destinations = useApi('/destinations');
  const testimonials = useApi('/testimonials');
  const gems = useApi('/gems?featured=true');

  const featured = trips.data?.filter((trip) => trip.featured) ?? [];
  const popularDestinations = destinations.data?.filter((destination) => destination.popular) ?? [];

  return (
    <>
      <Hero destinations={destinations.data ?? []} />
      {trips.data && destinations.data && <StatsStrip trips={trips.data} destinations={destinations.data} />}

      <section className="section" id="destinations">
        <div className="container">
          <SectionHeading
            eyebrow="Popular destinations"
            title="Where do you want to go next?"
            description="From snow-capped passes to palm-fringed beaches — pick a destination and see the trips we run there."
          />
          {destinations.error ? (
            <ErrorState message={destinations.error.message} onRetry={destinations.reload} />
          ) : (
            <ul className="destination-grid">
              {destinations.loading
                ? Array.from({ length: 8 }, (_, i) => <li key={i} className="destination-card skeleton" aria-hidden="true" />)
                : popularDestinations.map((destination) => (
                    <li key={destination.slug}>
                      <DestinationCard destination={destination} />
                    </li>
                  ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section section--soft" id="packages">
        <div className="container">
          <SectionHeading
            eyebrow="Featured trip packages"
            title="Hand-picked trips our travellers love"
            action={
              <Link to="/trips" className="btn btn--outline">
                View all trips <ArrowRight aria-hidden="true" />
              </Link>
            }
          />
          {trips.error ? (
            <ErrorState message={trips.error.message} onRetry={trips.reload} />
          ) : (
            <div className="trip-grid">
              {trips.loading
                ? Array.from({ length: 6 }, (_, i) => <TripCardSkeleton key={i} />)
                : featured.map((trip) => <TripCard key={trip.slug} trip={trip} />)}
            </div>
          )}
        </div>
      </section>

      {gems.data?.length > 0 && (
        <section className="section special" id="unexplored">
          <div className="container">
            <SectionHeading
              eyebrow="Special picks"
              title="Unexplored escapes, guided by nature and local experts"
              description="Quiet valleys, sacred forests, dark skies and hidden coves beyond the usual stops. Each comes with the best view, what to look for and a tip from someone who knows the place."
              action={
                <Link to="/unexplored" className="btn btn--outline">
                  See all unexplored spots <ArrowRight aria-hidden="true" />
                </Link>
              }
            />
            <div className="gem-grid gem-grid--compact">
              {gems.data.map((gem) => (
                <GemCard key={gem.slug} gem={gem} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <WhyUs />
      {testimonials.data && <Testimonials items={testimonials.data} />}
      <CtaBanner />
    </>
  );
}
