'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion';

/**
 * Counts a number up from 0 the first time it scrolls into view. With
 * reduced motion, the final value is shown immediately (no counting).
 */
export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.2, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const prefersReducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}
