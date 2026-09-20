'use client';

import Link from 'next/link';
import ParallaxElement from '@/components/motion/ParallaxElement';
import SectionTransition from '@/components/motion/SectionTransition';

export default function FinalCtaSection() {
  return (
    <section className="flex min-h-screen flex-col justify-center px-4 py-20">
      <SectionTransition className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary-light to-accent-dark px-8 py-16 text-center sm:px-16">
          <ParallaxElement
            speed={24}
            axis="x"
            className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <ParallaxElement
            speed={24}
            axis="y"
            className="pointer-events-none absolute -bottom-12 -right-10 h-64 w-64 rounded-full bg-accent/20 blur-2xl"
          />

          <h2 className="relative font-display text-4xl font-semibold text-white sm:text-5xl">
            Ready to shop, sell, or speak up?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">
            One transparent, government-aligned place to start.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-6 py-3.5 font-semibold text-primary transition-all duration-200 hover:scale-105 hover:bg-white/90"
            >
              Create Free Account
            </Link>
            <Link
              href="/customer/complaints/new"
              className="rounded-full border border-white/40 px-6 py-3.5 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-white/10"
            >
              File a Complaint
            </Link>
          </div>
        </div>
      </SectionTransition>
    </section>
  );
}
