import { useCallback, useEffect, useState } from 'react';
import api from './api';

// Fetch a URL on mount (and whenever it changes); returns data plus a reload function
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      setData(await api.get(url));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
