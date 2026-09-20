'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Copy, Check, Users } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

export default function ReferAndEarnPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      setLink(`${window.location.origin}/register?ref=${user._id}`);
    }
  }, [user]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard access denied — link stays selectable in the input
    }
  };

  if (!user || user.role !== 'customer') return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift size={20} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Rewards</span>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Refer & Earn</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Share your personal link with friends and family. Once referral tracking goes live, you&apos;ll see your invites
        and any rewards here.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Your Referral Link</label>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-accent-light p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-accent-dark">
          <Users size={18} />
        </span>
        <p className="text-sm text-ink-muted">Referral history and rewards tracking are coming soon.</p>
      </div>
    </div>
  );
}
