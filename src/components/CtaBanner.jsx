import { Link } from 'react-router-dom';

export default function CtaBanner() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="cta-banner">
          <div>
            <h2>Can’t find the perfect trip?</h2>
            <p>Tell us where you want to go and when. We’ll put together a custom itinerary for you and your group.</p>
          </div>
          <div className="cta-banner__actions">
            <Link to="/contact" className="btn btn--cta btn--lg">
              Get a custom plan
            </Link>
            <Link to="/trips" className="btn btn--light btn--lg">
              Browse all trips
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
