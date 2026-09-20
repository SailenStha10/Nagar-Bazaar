'use client';

import { motion } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion';

/**
 * A card that can start partially off-position (translated, rotated, scaled
 * down) and settles into place the first time it scrolls into view. Meant
 * for hero/product/seller cards that should feel like they "arrive" rather
 * than just fade in place. Once settled it stops moving entirely.
 */
export default function FloatingCard({
  children,
  className = '',
  x = 0,
  y = 40,
  rotate = 0,
  scale = 0.94,
  delay = 0,
  duration = 0.7,
  once = true,
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, margin: '-60px' }}
        transition={{ duration: 0.3, delay: delay / 1000 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y, rotate, scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
