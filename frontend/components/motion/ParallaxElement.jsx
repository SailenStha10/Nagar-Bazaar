'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion';

/**
 * Moves its children along a scroll-linked transform as the element travels
 * through the viewport — the core "different speeds / depth" building block.
 * `speed` is the max pixel offset in each direction; `axis` picks x or y;
 * `rotate` is an optional max degree swing (kept small per design guidance).
 * Disabled entirely under prefers-reduced-motion.
 */
export default function ParallaxElement({
  children,
  className = '',
  speed = 40,
  axis = 'y',
  rotate = 0,
  style,
}) {
  const ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const y = useTransform(scrollYProgress, [0, 1], axis === 'y' ? [speed, -speed] : [0, 0]);
  const x = useTransform(scrollYProgress, [0, 1], axis === 'x' ? [speed, -speed] : [0, 0]);
  const rotateDeg = useTransform(scrollYProgress, [0, 1], rotate ? [-rotate, rotate] : [0, 0]);

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y, x, rotate: rotateDeg, ...style }}>
      {children}
    </motion.div>
  );
}
