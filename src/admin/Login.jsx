import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import Field from '../components/Field';
import Logo from '../components/Logo';
import { SITE } from '../config/site';
import { OWNER_KEY } from '../utils/track';

export default function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in (e.g. opened /admin/login in a new tab): skip straight to the panel.
  useEffect(() => {
    adminApi
      .me()
      .then((result) => result.authenticated && navigate('/admin', { replace: true }))
      .catch(() => {});
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.login(password);
      // Keeps the owner's own browsing out of the Visitors numbers.
      try {
        localStorage.setItem(OWNER_KEY, '1');
      } catch {
        // Storage blocked: the visits just get counted.
      }
      navigate('/admin', { replace: true });
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-card admin-login__card" onSubmit={submit} noValidate>
        <Logo />
        <p className="eyebrow">{SITE.name}</p>
        <h1>Admin sign in</h1>
        <p className="admin-muted">Only the owner can open this panel.</p>
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error}
        />
        <button type="submit" className="btn btn--cta btn--block" disabled={busy || !password}>
          <Lock aria-hidden="true" />
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
