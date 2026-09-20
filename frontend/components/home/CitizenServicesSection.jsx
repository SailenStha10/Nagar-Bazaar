'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Landmark } from 'lucide-react';
import FadeUp from '@/components/motion/FadeUp';
import ParallaxElement from '@/components/motion/ParallaxElement';
import { citizenServices, notices, priorityColor } from './data';

const speeds = [14, 22, 18, 26];

export default function CitizenServicesSection() {
  return (
    <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-20">
      <FadeUp direction="fade" className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Citizen Services</span>
        <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Citizens, connected to oversight
        </h2>
      </FadeUp>

      <div className="relative mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        {/* Services */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {citizenServices.map((service, i) => (
            <ParallaxElement key={service.title} speed={speeds[i % speeds.length]} axis="y">
              <FadeUp direction="left" delay={i * 70}>
                <Link
                  href={service.href}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-surface-raised p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light text-accent-dark transition-transform duration-300 group-hover:scale-110">
                    <service.icon size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink transition group-hover:text-primary">
                    {service.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{service.description}</p>
                </Link>
              </FadeUp>
            </ParallaxElement>
          ))}
        </div>

        {/* Connector */}
        <div className="hidden flex-col items-center gap-3 lg:flex">
          <span className="h-16 w-px bg-border" />
          <FadeUp direction="fade">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl">
              <Landmark size={22} />
            </span>
          </FadeUp>
          <span className="h-16 w-px bg-border" />
        </div>

        {/* Notices */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">Latest Notices</h3>
            <Link href="/notices" className="flex items-center gap-1 text-sm font-semibold text-primary">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {notices.map((notice, i) => (
              <ParallaxElement key={notice.title} speed={speeds[i % speeds.length]} axis="y">
                <FadeUp direction="right" delay={i * 70}>
                  <div className="rounded-2xl border border-border bg-surface-raised p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityColor[notice.priority]}`}>
                        {notice.category}
                      </span>
                      <FileText size={14} className="text-ink-muted" />
                    </div>
                    <p className="mt-3 font-display text-sm font-semibold leading-snug text-ink">{notice.title}</p>
                    <p className="mt-2 text-xs text-ink-muted">{notice.date}</p>
                  </div>
                </FadeUp>
              </ParallaxElement>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
