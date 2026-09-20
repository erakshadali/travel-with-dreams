import { useEffect, useState } from 'react';
import { api } from '../api/client';

// GETs `path` and re-fetches when it changes. `loading` is derived (result is for a
// different path/attempt), so no state is set synchronously inside the effect.
export function useApi(path) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ path: null, attempt: -1, data: null, error: null });

  useEffect(() => {
    let active = true;
    api
      .get(path)
      .then((data) => active && setResult({ path, attempt, data, error: null }))
      .catch((error) => active && setResult({ path, attempt, data: null, error }));
    return () => {
      active = false;
    };
  }, [path, attempt]);

  const settled = result.path === path && result.attempt === attempt;
  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: !settled,
    reload: () => setAttempt((n) => n + 1),
  };
}
