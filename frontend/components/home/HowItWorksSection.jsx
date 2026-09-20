'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import FadeUp from '@/components/motion/FadeUp';
import usePrefersReducedMotion from '@/components/motion/usePrefersReducedMotion';
import { ecommerceSteps, governanceSteps } from './data';

function StepColumn({ label, steps, tone, iconTone, lineProgress, prefersReducedMotion, align }) {
  return (
    <div className={align === 'right' ? 'lg:pl-10' : 'lg:pr-10 lg:text-right'}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${tone}`}>{label}</p>

      <div className="relative mt-6">
        <div className={`absolute top-0 bottom-0 hidden w-0.5 bg-white/10 lg:block ${align === 'right' ? 'left-0' : 'right-0'}`} />
        {!prefersReducedMotion && (
          <motion.div
            className={`absolute top-0 hidden w-0.5 origin-top bg-accent lg:block ${align === 'right' ? 'left-0' : 'right-0'}`}
            style={{ scaleY: lineProgress, height: '100%' }}
          />
        )}

        <div className="space-y-8">
          {steps.map((step, i) => (
            <FadeUp key={step.title} direction={align === 'right' ? 'left' : 'right'} delay={i * 90}>
              <div className={`relative flex items-center gap-4 ${align === 'right' ? '' : 'lg:flex-row-reverse'}`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ${iconTone}`}>
                  <step.icon size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.description}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.5'] });
  const lineProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={sectionRef} className="flex min-h-screen flex-col justify-center bg-primary-dark px-4 py-20 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <FadeUp direction="fade" className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">The Process</span>
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">How Nagar Bazaar works</h2>
        </FadeUp>

        <div className="relative mt-16 grid grid-cols-1 gap-14 lg:grid-cols-2">
          <span className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/10 lg:block" />

          <StepColumn
            label="E-Commerce"
            steps={ecommerceSteps}
            tone="text-accent"
            iconTone="text-accent"
            lineProgress={lineProgress}
            prefersReducedMotion={prefersReducedMotion}
            align="left"
          />
          <StepColumn
            label="E-Governance"
            steps={governanceSteps}
            tone="text-local-light"
            iconTone="text-local-light"
            lineProgress={lineProgress}
            prefersReducedMotion={prefersReducedMotion}
            align="right"
          />
        </div>
      </div>
    </section>
  );
}
