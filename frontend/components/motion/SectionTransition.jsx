'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion';

/**
 * Softens a section's entry/exit edges with a scroll-linked opacity + drift,
 * so moving between sections feels continuous rather than a hard cut. Fully
 * opaque and settled for the large middle portion of the section's time in
 * view, so content stays readable — this only touches the transition zones.
 */
export default function SectionTransition({ children, className = '' }) {
  const ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);
  const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [24, 0, 0, -24]);

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}
