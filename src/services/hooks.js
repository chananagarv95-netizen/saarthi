import { useEffect, useState } from 'react';
import { api } from './api';

// Module-level promise cache: every component shares one request per resource.
const cache = {};
const useCached = (key, loader) => {
  const [state, setState] = useState(() => ({ data: cache[key]?.data || null, error: null }));
  useEffect(() => {
    if (cache[key]?.data) return undefined;
    let alive = true;
    cache[key] = cache[key] || { promise: loader().then((data) => { cache[key].data = data; return data; }) };
    cache[key].promise
      .then((data) => alive && setState({ data, error: null }))
      .catch((error) => { delete cache[key]; if (alive) setState({ data: null, error }); });
    return () => { alive = false; };
  }, [key, loader]);
  return state;
};

export const useServices = () => useCached('services', api.services);
export const useDraftTypes = () => useCached('draftTypes', api.draftTypes);
