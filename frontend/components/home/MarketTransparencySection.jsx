'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Info } from 'lucide-react';
import FadeUp from '@/components/motion/FadeUp';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import { transparencyMetrics, transparencyTrend } from './data';

export default function MarketTransparencySection() {
  return (
    <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-20">
      <FadeUp direction="fade" className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">Market Transparency</span>
        <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">Oversight you can see</h2>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
          <Info size={13} />
          Sample data for illustration — not live government figures.
        </p>
      </FadeUp>

      <StaggerContainer className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
        {transparencyMetrics.map((metric) => (
          <StaggerItem key={metric.label}>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-raised p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-xl">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-primary group-hover:text-white">
                <metric.icon size={18} />
              </span>
              <p className="relative mt-4 font-display text-3xl font-semibold text-ink">
                <AnimatedCounter value={metric.value} suffix={metric.suffix} />
              </p>
              <p className="relative mt-1 text-xs font-medium text-ink-muted">{metric.label}</p>
              <p className="relative mt-2 text-[11px] text-ink-muted/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {metric.trend}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeUp direction="up" delay={150} className="mt-8 rounded-2xl border border-border bg-surface-raised p-6 transition-shadow duration-300 hover:shadow-lg">
        <h3 className="font-display text-base font-semibold text-ink">Complaints Filed vs. Resolved (Sample)</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transparencyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="complaints" name="Filed" stroke="#c1712f" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#0f2c4c" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </FadeUp>
    </section>
  );
}
