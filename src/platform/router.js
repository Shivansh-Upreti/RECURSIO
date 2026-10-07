import { useEffect, useState } from 'react';

/* Minimal hash router (#/sorting). Hash routes work on any static host with no redirect rules,
   which keeps the Netlify Drop deployment config-free. */
const read = () => decodeURIComponent(location.hash.replace(/^#\/?/, '').split('?')[0]).toLowerCase();

export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (path) => '#/' + (path || '');
