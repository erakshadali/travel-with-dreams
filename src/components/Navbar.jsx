import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { SITE } from '../config/site';
import '../styles/Navbar.css';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/trips', label: 'Trips' },
  { to: '/unexplored', label: 'Unexplored' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  // The menu remembers which page it was opened on, so it closes itself after any navigation.
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenu({ open: false, path: pathname });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, pathname]);

  const closeMenu = () => setMenu({ open: false, path: pathname });
  // Transparent over the home hero until you scroll; solid everywhere else.
  const overlay = pathname === '/' && !scrolled && !menuOpen;

  return (
    <header className={`navbar${overlay ? ' navbar--overlay' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" onClick={closeMenu}>
          <Logo className="navbar__logo" />
          <span className="navbar__name">{SITE.name}</span>
        </Link>

        <nav id="primary-nav" className={`navbar__nav${menuOpen ? ' is-open' : ''}`} aria-label="Primary">
          <ul className="navbar__links">
            {LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={closeMenu}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/contact" className="btn btn--cta navbar__cta" onClick={closeMenu}>
            Plan my trip
          </Link>
        </nav>

        <button
          type="button"
          className="navbar__toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenu({ open: !menuOpen, path: pathname })}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
