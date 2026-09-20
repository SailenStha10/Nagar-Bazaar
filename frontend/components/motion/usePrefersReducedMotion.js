'use client';

import { useEffect, useState } from 'react';

// framer-motion's own useReducedMotion() can resolve synchronously on the
// client's very first render, which — if it differs from the server's
// default — makes React hydrate a mismatched DOM (our components render a
// plain <div> vs a <motion.div> depending on this value). Starting at
// `false` on every render and correcting via an effect keeps the first
// client render identical to the server output; the correction then lands
// as a normal post-hydration update instead of a hydration error.
export default function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const handleChange = (e) => setReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
