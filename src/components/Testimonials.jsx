import { Quote, Star } from 'lucide-react';
import SectionHeading from './SectionHeading';

export default function Testimonials({ items }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading center eyebrow="Traveller stories" title="What our travellers say" />
        <ul className="testimonials">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="testimonial">
              <Quote className="testimonial__quote" aria-hidden="true" />
              <p className="testimonial__stars" aria-label={`${item.rating} out of 5 stars`}>
                {Array.from({ length: item.rating }, (_, i) => (
                  <Star key={i} aria-hidden="true" fill="currentColor" />
                ))}
              </p>
              <blockquote>{item.quote}</blockquote>
              <footer>
                <span className="testimonial__avatar" aria-hidden="true">
                  {item.name[0]}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.from} · {item.trip}
                  </small>
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
