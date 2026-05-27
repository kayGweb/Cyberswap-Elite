import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport is at or below the given max-width breakpoint.
 * Defaults to 767px (below Tailwind's md: 768px).
 *
 * Safe for SSR and HMR. Uses matchMedia + listener for live updates.
 */
export function useIsMobile(maxWidth = 767): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Guard for non-browser environments (SSR, tests)
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = `(max-width: ${maxWidth}px)`;
    const mql = window.matchMedia(mediaQuery);

    // Set initial value
    setIsMobile(mql.matches);

    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Modern browsers
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    // Older Safari fallback
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [maxWidth]);

  return isMobile;
}
