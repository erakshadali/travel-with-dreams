import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Loads data for an admin screen and reloads whenever `key` changes (a string describing the filters).
// Like useApi, `loading` is derived rather than set inside the effect; the previous result stays on screen
// while a new one loads, so typing in a search box does not flash an empty page.
// A 401 means the session ended, so go back to the login page.
export function useAdminData(load, key) {
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, attempt: -1, data: null, error: null });

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setResult({ key, attempt, data, error: null }))
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) navigate('/admin/login', { replace: true });
        else setResult({ key, attempt, data: null, error: error.message });
      });
    return () => {
      active = false;
    };
    // `load` is a new closure every render; `key` already describes what it fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt, navigate]);

  const settled = result.key === key && result.attempt === attempt;
  return {
    data: result.data,
    error: settled ? result.error : null,
    loading: !settled,
    reload: () => setAttempt((n) => n + 1),
    setData: (data) => setResult((previous) => ({ ...previous, data })),
  };
}
