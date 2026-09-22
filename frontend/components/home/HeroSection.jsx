'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Truck, Lock, MessageSquareWarning, ArrowRight, Sparkles } from 'lucide-react';
import ParallaxElement from '@/components/motion/ParallaxElement';
import usePrefersReducedMotion from '@/components/motion/usePrefersReducedMotion';
import { stats } from './data';

const IMAGE_CANDIDATES = ['/hero-handshake.png', '/images/hero-handshake.jpg', '/images/hero-handshake.webp'];

// Trust badges beneath the hero content, mirroring the reference layout's
// "Farm Fresh / Free Delivery / Secure Payment / Easy Returns" row — reworked
// with this platform's own value props instead of grocery-specific copy.
const trustBadges = [
  { icon: ShieldCheck, title: 'Officer-Verified', description: 'Every seller reviewed' },
  { icon: Truck, title: 'Tracked Delivery', description: 'Follow every order' },
  { icon: Lock, title: 'Secure Payments', description: '100% protected checkout' },
  { icon: MessageSquareWarning, title: 'Open Grievances', description: 'Public, timestamped' },
];

export default function HeroSection() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [imageIndex, setImageIndex] = useState(0);
  const imageExhausted = imageIndex >= IMAGE_CANDIDATES.length;

  // Drives the "leaving the hero" feel: as the section scrolls up and out of
  // view, only the decorative pieces (blobs, image) fade and drift away —
  // the heading, subtext and CTAs are never touched by this, so they stay
  // readable the whole time.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const decorativeOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const decorativeY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const decorativeStyle = prefersReducedMotion ? undefined : { opacity: decorativeOpacity, y: decorativeY };
  const DecorativeWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-linear-to-b from-primary-light/15 via-accent-light/20 to-surface px-4 py-24"
    >
      <DecorativeWrapper style={decorativeStyle}>
        <ParallaxElement speed={30} axis="y" className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-light/25 blur-3xl" />
        <ParallaxElement speed={50} axis="x" className="pointer-events-none absolute -right-16 top-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </DecorativeWrapper>

      {/* Split hero, like the reference's homepage: copy + CTAs on the left,
          a framed visual with an overlapping badge on the right. */}
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <span className="reveal-down inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent-dark">
            <Sparkles size={13} />
            Commerce Meets Governance
          </span>
          <h1 className="reveal-down mt-3 text-balance font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
            Commerce You Can Shop.
            <br />
            <span className="text-primary">Governance You Can Trust.</span>
          </h1>
          <p className="reveal-down mx-auto mt-5 max-w-md text-balance text-lg text-ink-muted lg:mx-0" style={{ animationDelay: '80ms' }}>
            One platform. Verified sellers, real officers, one shared record.
          </p>

          <div className="reveal-down mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ animationDelay: '140ms' }}>
            <Link
              href="/products"
              className="group flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl"
            >
              Shop Now
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/local-products"
              className="rounded-full border border-border bg-surface-raised px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              Explore Deals
            </Link>
          </div>

          {/* Trust badges row */}
          <div
            className="reveal-down mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:mt-14"
            style={{ animationDelay: '220ms' }}
          >
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-local-light text-local">
                  <badge.icon size={17} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-ink">{badge.title}</p>
                  <p className="text-[11px] text-ink-muted">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framed visual with an overlapping stat badge, like the reference's
            "UP TO 30% OFF" circle over its hero basket photo. */}
        <DecorativeWrapper style={decorativeStyle} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <ParallaxElement speed={18} axis="y" className="relative">
            <div className="pointer-events-none absolute inset-0 -m-8 rounded-full bg-linear-to-br from-primary-light/30 via-accent-light/40 to-local-light/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 to-accent-light shadow-2xl">
              {!imageExhausted && (
                <img
                  src={IMAGE_CANDIDATES[imageIndex]}
                  alt="Citizens and government working together on Nagar Bazaar"
                  className="aspect-4/3 w-full object-cover"
                  onError={() => setImageIndex((i) => i + 1)}
                />
              )}
            </div>

            <div className="absolute -right-4 -top-4 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-local text-center text-white shadow-xl sm:h-28 sm:w-28">
              <span className="font-display text-xl font-bold sm:text-2xl">{stats[0].value}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide">{stats[0].label}</span>
            </div>
          </ParallaxElement>
        </DecorativeWrapper>
      </div>

      {/* Command-bar style search CTA — kept stable, never parallaxed */}
      <div className="reveal-down relative mx-auto mt-14 w-full max-w-xl" style={{ animationDelay: '280ms' }}>
        <Link
          href="/products"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-raised px-5 py-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span className="flex items-center gap-3 text-sm text-ink-muted">
            <Sparkles size={17} className="text-ink-muted" />
            Search for Gundruk, honey, rice, or a nearby store...
          </span>
          <span className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-transform duration-200 group-hover:scale-105">
            Browse
          </span>
        </Link>
      </div>
    </section>
  );
}
