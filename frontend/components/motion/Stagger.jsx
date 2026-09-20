'use client';

import { motion } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion';

/**
 * Wraps a group of StaggerItem children so they reveal one after another
 * as the group scrolls into view, instead of all at once.
 */
export function StaggerContainer({ children, className = '', staggerDelay = 0.1, once = true }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: prefersReducedMotion ? 0 : staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const reducedItemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function StaggerItem({ children, className = '', as: Component = motion.div }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Component
      className={className}
      variants={prefersReducedMotion ? reducedItemVariants : itemVariants}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
