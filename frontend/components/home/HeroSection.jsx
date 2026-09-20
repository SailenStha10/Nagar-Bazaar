'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Search, Sparkles } from 'lucide-react';
import ParallaxElement from '@/components/motion/ParallaxElement';
import usePrefersReducedMotion from '@/components/motion/usePrefersReducedMotion';
import { stats } from './data';

const IMAGE_CANDIDATES = ['/images/hero-handshake.jpg', '/images/hero-handshake.png', '/images/hero-handshake.webp'];

export default function HeroSection() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [imageIndex, setImageIndex] = useState(0);
  const imageExhausted = imageIndex >= IMAGE_CANDIDATES.length;

  // Drives the "leaving the hero" feel: as the section scrolls up and out of
  // view, only the decorative pieces (blobs, image) fade and drift away —
  // the heading, subtext and search bar are never touched by this, so they
  // stay readable the whole time.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const decorativeOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const decorativeY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const decorativeStyle = prefersReducedMotion ? undefined : { opacity: decorativeOpacity, y: decorativeY };
  const DecorativeWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-b from-primary-light/15 via-accent-light/20 to-surface px-4 py-24"
    >
      <DecorativeWrapper style={decorativeStyle}>
        <ParallaxElement speed={30} axis="y" className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-light/25 blur-3xl" />
        <ParallaxElement speed={50} axis="x" className="pointer-events-none absolute -right-16 top-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </DecorativeWrapper>

      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="reveal-down text-balance font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl lg:text-[4.2rem]">
          Commerce You Can Shop.
          <br />
          Governance You Can Trust.
        </h1>
        <p
          className="reveal-down mx-auto mt-5 max-w-xl text-balance text-lg text-ink-muted"
          style={{ animationDelay: '80ms' }}
        >
          One platform. Verified sellers, real officers, one shared record.
        </p>
      </div>

      {/* Centered visual — blended into the surrounding blobs rather than a
          hard-edged photo cutout. */}
      <DecorativeWrapper style={decorativeStyle} className="relative mt-10 w-full max-w-lg">
        <ParallaxElement speed={18} axis="y" className="relative">
          <div className="pointer-events-none absolute inset-0 -m-10 rounded-full bg-linear-to-br from-primary-light/30 via-accent-light/40 to-local-light/30 blur-2xl" />
          <div
            className="relative min-h-64 overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 to-accent-light shadow-2xl"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    maskImage: 'radial-gradient(circle at 50% 45%, black 62%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 45%, black 62%, transparent 100%)',
                  }
            }
          >
            {!imageExhausted && (
              <img
                src={IMAGE_CANDIDATES[imageIndex]}
                alt="Citizens and government working together on Nagar Bazaar"
                className="aspect-4/3 w-full object-cover"
                onError={() => setImageIndex((i) => i + 1)}
              />
            )}
          </div>
        </ParallaxElement>
      </DecorativeWrapper>

      {/* Command-bar style search CTA — kept stable, never parallaxed */}
      <div className="reveal-down relative mx-auto mt-10 w-full max-w-xl" style={{ animationDelay: '200ms' }}>
        <Link
          href="/products"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-raised px-5 py-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span className="flex items-center gap-3 text-sm text-ink-muted">
            <Search size={17} className="text-ink-muted" />
            Search for Gundruk, honey, rice, or a nearby store...
          </span>
          <span className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-transform duration-200 group-hover:scale-105">
            <Sparkles size={13} />
            Browse
          </span>
        </Link>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
          <ShieldCheck size={13} className="text-local" />
          Officer-verified sellers only
        </div>
      </div>

      <dl
        className="reveal-down relative mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 text-center sm:grid-cols-4"
        style={{ animationDelay: '280ms' }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="font-display text-2xl font-semibold text-ink sm:text-3xl">{stat.value}</dt>
            <dd className="mt-1 text-xs text-ink-muted">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
