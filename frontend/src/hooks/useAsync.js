import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Runs an async loader on mount and whenever `deps` change.
 * Returns { data, loading, error, reload }. A 401 logs the user out (session expired).
 */
export function useAsync(loader, deps = []) {
  const { logout } = useAuth();
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);

  const run = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === latest.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (error.status === 401) logout();
      if (id === latest.current) setState((s) => ({ ...s, loading: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { ...state, reload: run };
}
