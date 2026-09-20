import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll back to the top on every page change (but not for in-page #anchors).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
