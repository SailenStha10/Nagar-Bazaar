'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgePercent } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

export default function PromoCodesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setMessage('Promo codes aren’t live yet, so this code couldn’t be applied. Check back soon.');
  };

  if (!user || user.role !== 'customer') return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BadgePercent size={20} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Rewards</span>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Promo Codes</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-muted">Have a promo code? Enter it here to apply it at checkout.</p>

      <form onSubmit={handleApply} className="mt-6 flex items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setMessage('');
          }}
          placeholder="Enter promo code"
          className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Apply
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-ink-muted">{message}</p>}
    </div>
  );
}
