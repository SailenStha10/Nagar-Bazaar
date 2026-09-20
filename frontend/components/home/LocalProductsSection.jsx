'use client';

import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';
import FadeUp from '@/components/motion/FadeUp';
import FloatingCard from '@/components/motion/FloatingCard';
import { localBusinessBenefits } from './data';

export default function LocalProductsSection() {
  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-linear-to-br from-local-light/40 via-surface to-surface px-4 py-20">
      <div className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-local/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeUp direction="left">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-local">
              <Leaf size={14} />
              For Local Businesses
            </span>
            <h2 className="mt-3 text-balance font-display text-4xl font-semibold text-ink sm:text-5xl">
              Your product, on every citizen&rsquo;s shortlist.
            </h2>
            <p className="mt-4 max-w-md text-ink-muted">
              List with Nagar Bazaar and sell to verified buyers under an officer-backed trust badge.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-local px-6 py-3.5 font-semibold text-white shadow-lg shadow-local/20 transition-all duration-200 hover:scale-105 hover:bg-local/90"
            >
              Become a Seller
              <ArrowRight size={16} />
            </Link>
          </FadeUp>

          <div className="relative flex flex-col gap-4">
            {localBusinessBenefits.map((benefit, i) => (
              <FloatingCard key={benefit.title} x={i % 2 === 0 ? 40 : -40} delay={i * 90}>
                <div className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-raised p-5 transition-all duration-300 hover:-translate-x-1 hover:border-local hover:shadow-xl">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-local-light text-local transition-transform duration-300 group-hover:scale-110">
                    <benefit.icon size={22} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">{benefit.title}</p>
                    <p className="text-sm text-ink-muted">{benefit.description}</p>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
