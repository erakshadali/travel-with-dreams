import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { SITE } from '../config/site';
import '../styles/Footer.css';

const EXPLORE = [
  { to: '/', label: 'Home' },
  { to: '/trips', label: 'All trips' },
  { to: '/unexplored', label: 'Unexplored escapes' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact & enquiries' },
];

const POPULAR = [
  { slug: 'himalayas', label: 'Himalayas' },
  { slug: 'kashmir', label: 'Kashmir' },
  { slug: 'kerala', label: 'Kerala' },
  { slug: 'goa', label: 'Goa' },
  { slug: 'rajasthan', label: 'Rajasthan' },
  { slug: 'bali', label: 'Bali' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <Link to="/" className="footer__brand">
            <Logo className="footer__logo" />
            {SITE.name}
          </Link>
          <p>{SITE.footerBlurb}</p>
        </div>

        <nav aria-label="Explore">
          <h2>Explore</h2>
          <ul>
            {EXPLORE.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Popular destinations">
          <h2>Popular destinations</h2>
          <ul>
            {POPULAR.map(({ slug, label }) => (
              <li key={slug}>
                <Link to={`/trips?destination=${slug}`}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2>Get in touch</h2>
          <ul className="footer__contact">
            <li>
              <Phone aria-hidden="true" />
              <a href={SITE.phoneHref}>{SITE.phone}</a>
            </li>
            <li>
              <Mail aria-hidden="true" />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
            <li>
              <MapPin aria-hidden="true" />
              <span>{SITE.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
