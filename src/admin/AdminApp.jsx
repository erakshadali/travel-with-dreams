import { useEffect, useState } from 'react';
import { CalendarCheck, ExternalLink, History, LayoutDashboard, LogOut, Menu, MessageSquare, X } from 'lucide-react';
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { SITE } from '../config/site';
import { adminApi } from '../api/client';
import Activity from './Activity';
import Login from './Login';
import Overview from './Overview';
import Submissions from './Submissions';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { to: '/admin/activity', label: 'Activity log', icon: History },
];

// The panel holds customer details and is not for search engines.
function useAdminHead() {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.append(meta);
    document.title = `Admin · ${SITE.name}`;
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);
}

function Shell() {
  const navigate = useNavigate();
  const [session, setSession] = useState('checking');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    adminApi
      .me()
      .then((result) => setSession(result.authenticated ? 'in' : 'out'))
      .catch(() => setSession('out'));
  }, []);

  async function signOut() {
    try {
      await adminApi.logout();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  }

  if (session === 'checking') return <div className="admin-boot" role="status">Loading…</div>;
  if (session === 'out') return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin">
      <header className="admin-topbar">
        <span className="admin-brand">
          <Logo />
          <span>Admin</span>
        </span>
        <button type="button" className="icon-btn" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <aside className={`admin-side${menuOpen ? ' is-open' : ''}`}>
        <span className="admin-brand admin-brand--side">
          <Logo />
          <span>
            {SITE.name}
            <small>Admin panel</small>
          </span>
        </span>
        <nav aria-label="Admin">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="admin-nav__link" onClick={() => setMenuOpen(false)}>
              <Icon aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side__foot">
          <a className="admin-nav__link" href="/" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            View website
          </a>
          <button type="button" className="admin-nav__link" onClick={signOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main" id="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminApp() {
  useAdminHead();

  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<Shell />}>
        <Route index element={<Overview />} />
        <Route path="bookings" element={<Submissions key="booking" kind="booking" />} />
        <Route path="enquiries" element={<Submissions key="enquiry" kind="enquiry" />} />
        <Route path="activity" element={<Activity />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
