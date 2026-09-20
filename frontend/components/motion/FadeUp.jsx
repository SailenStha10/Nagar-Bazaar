'use client';

import { motion } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion';

const OFFSETS = {
  up: { x: 0, y: 32 },
  down: { x: 0, y: -32 },
  left: { x: -40, y: 0 },
  right: { x: 40, y: 0 },
  fade: { x: 0, y: 0 },
};

/**
 * Fades + slides a section/element in the first time it scrolls into view.
 * Falls back to a plain opacity fade when the user prefers reduced motion.
 */
export default function FadeUp({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  as: Component = motion.div,
  once = true,
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const offset = OFFSETS[direction] || OFFSETS.up;

  if (prefersReducedMotion) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, margin: '-80px' }}
        transition={{ duration: 0.3, delay: delay / 1000 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
