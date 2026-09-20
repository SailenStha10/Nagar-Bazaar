'use client';

import Link from 'next/link';
import { ArrowRight, Store, ShieldCheck, MapPin, Star, Package, Leaf } from 'lucide-react';
import FadeUp from '@/components/motion/FadeUp';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { demoSellers, localProducts } from './data';

export default function VerifiedSellersSection() {
  return (
    <section className="flex min-h-screen flex-col justify-center bg-surface-alt px-4 py-20">
      <div className="mx-auto w-full max-w-7xl">
        <FadeUp direction="fade" className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Verified Sellers</span>
            <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">Storefronts you can trust</h2>
          </div>
          <Link href="/sellers" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            View all stores
            <ArrowRight size={15} />
          </Link>
        </FadeUp>

        {/* Each card links the seller directly to what it actually sells —
            staggered in, then still, per the design guidance. */}
        <StaggerContainer className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.12}>
          {demoSellers.map((seller) => {
            const sold = localProducts.filter((p) => p.producer === seller.name);
            return (
              <StaggerItem key={seller.name}>
                <div className="group flex flex-col rounded-2xl border border-border bg-surface-raised p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Store size={20} />
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
                      <ShieldCheck size={11} />
                      Verified
                    </span>
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold text-ink transition group-hover:text-primary">
                    {seller.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin size={12} />
                    {seller.location}
                  </p>
                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-accent text-accent" />
                      {seller.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={12} />
                      {seller.productCount} products
                    </span>
                  </div>

                  {sold.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-border pt-3">
                      {sold.map((p) => (
                        <span
                          key={p.name}
                          className="flex items-center gap-1 rounded-full bg-local-light px-2 py-1 text-[10px] font-medium text-local transition-colors duration-200 group-hover:bg-local group-hover:text-white"
                        >
                          <Leaf size={9} />
                          {p.name.replace(/\s*\(.*\)/, '')}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/sellers"
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-border py-2 text-xs font-semibold text-ink transition-all duration-200 hover:border-primary hover:text-primary"
                  >
                    Visit Store
                  </Link>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
