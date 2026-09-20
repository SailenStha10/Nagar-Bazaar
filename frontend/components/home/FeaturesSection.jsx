'use client';

import { motion } from 'framer-motion';
import FadeUp from '@/components/motion/FadeUp';
import usePrefersReducedMotion from '@/components/motion/usePrefersReducedMotion';
import { features } from './data';

export default function FeaturesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section className="flex min-h-screen flex-col justify-center bg-surface-alt px-4 py-20">
      <div className="mx-auto w-full max-w-6xl">
        <FadeUp direction="fade" className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Why Nagar Bazaar</span>
          <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">
            Government-grade accountability
          </h2>
        </FadeUp>

        <div className="mt-16 divide-y divide-border border-y border-border">
          {features.map((feature, i) => (
            <div key={feature.title} className="group flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:gap-8">
              <span className="font-display text-sm text-ink-muted/60">0{i + 1}</span>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <feature.icon size={20} />
              </div>

              <div className="overflow-hidden">
                <motion.h3
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-2xl font-semibold text-ink sm:text-3xl"
                >
                  {feature.title}
                </motion.h3>
              </div>

              <p className="text-sm text-ink-muted sm:ml-auto sm:max-w-xs sm:text-right">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
