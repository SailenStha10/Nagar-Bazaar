'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Landmark } from 'lucide-react';
import usePrefersReducedMotion from './usePrefersReducedMotion';

/**
 * A slim vertical thread docked to the viewport edge that fills as the
 * visitor scrolls from the hero down to the footer — a visual stand-in for
 * "government oversight runs through the whole page." Fixed + transform
 * only (cheap), hidden on small screens to avoid crowding mobile layouts,
 * and skipped entirely under reduced motion.
 */
export default function GovernmentThread() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.3 });
  const dotTop = useTransform(progress, [0, 1], ['0%', '100%']);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-y-0 left-4 z-40 hidden w-px lg:block">
      <span className="absolute left-0 top-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg">
        <Landmark size={13} />
      </span>

      <div className="absolute left-0 top-20 h-[calc(100%-6.5rem)] w-px bg-border" />
      <motion.div className="absolute left-0 top-20 h-[calc(100%-6.5rem)] w-px origin-top bg-primary" style={{ scaleY: progress }} />
      <motion.span
        className="absolute left-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-md"
        style={{ top: dotTop }}
      />
    </div>
  );
}
