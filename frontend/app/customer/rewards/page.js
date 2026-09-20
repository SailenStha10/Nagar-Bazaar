'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

export default function RewardsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!user || user.role !== 'customer') return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Award size={20} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Rewards</span>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Rewards</h1>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6 text-center">
        <p className="font-display text-4xl font-bold text-ink">0</p>
        <p className="mt-1 text-sm text-ink-muted">Reward points</p>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <Award size={36} className="text-ink-muted" />
        <p className="mt-4 font-display text-lg font-semibold text-ink">Earn points on every order</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Points-based rewards are coming soon — you&apos;ll be able to redeem them for discounts on future orders.
        </p>
      </div>
    </div>
  );
}
