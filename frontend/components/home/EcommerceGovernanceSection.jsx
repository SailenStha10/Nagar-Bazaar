'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Handshake } from 'lucide-react';
import FadeUp from '@/components/motion/FadeUp';
import usePrefersReducedMotion from '@/components/motion/usePrefersReducedMotion';
import { pathways } from './data';

export default function EcommerceGovernanceSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-20">
      <FadeUp direction="fade" className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Two platforms, one trust layer</span>
        <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">E-Commerce + E-Governance</h2>
      </FadeUp>

      <div className="relative mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Central divider — scales into view once the section is visible */}
        <motion.span
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary p-3 text-white shadow-xl lg:flex"
        >
          <Handshake size={20} />
        </motion.span>

        {pathways.map((path, i) => (
          <FadeUp key={path.title} direction={i === 0 ? 'left' : 'right'} duration={0.7}>
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-8 transition hover:shadow-xl">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  path.tone === 'accent' ? 'bg-accent-light text-accent-dark' : 'bg-primary/10 text-primary'
                }`}
              >
                <path.icon size={22} />
              </div>
              <span className="mt-5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{path.tag}</span>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{path.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{path.description}</p>

              <ul className="mt-5 space-y-2.5">
                {path.points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-ink">
                    <CheckCircle2 size={16} className="shrink-0 text-local" />
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href={path.cta.href}
                className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${
                  path.tone === 'accent' ? 'text-accent-dark' : 'text-primary'
                }`}
              >
                {path.cta.label}
                <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
