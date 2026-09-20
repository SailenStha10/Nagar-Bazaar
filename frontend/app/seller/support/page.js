'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifeBuoy, Mail, Phone, HelpCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

const faqs = [
  {
    q: 'How do I get my store verified?',
    a: 'Complete your seller profile from the dashboard. A government officer will review and approve it — you can track the status under Account Status on your dashboard.',
  },
  {
    q: 'How do I update my stock or prices?',
    a: 'Use Manage Stocks to quickly update quantities, or edit a product directly from My Products for price and detail changes.',
  },
  {
    q: 'How do I run a discount or offer?',
    a: 'Go to Offers to set a percentage or flat discount on any product — it will appear in the marketplace’s Sale & Discounted section automatically.',
  },
];

export default function SellerSupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LifeBuoy size={20} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Help</span>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Support</h1>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <a
          href="mailto:support@nagarbazaar.example"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-5 transition hover:border-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail size={18} />
          </span>
          <div>
            <p className="font-semibold text-ink">Email Us</p>
            <p className="text-sm text-ink-muted">support@nagarbazaar.example</p>
          </div>
        </a>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Phone size={18} />
          </span>
          <div>
            <p className="font-semibold text-ink">Seller Helpline</p>
            <p className="text-sm text-ink-muted">+977-1-4000000 (Sun&ndash;Fri, 10am&ndash;5pm)</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <HelpCircle size={18} className="text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface-raised">
          {faqs.map((f) => (
            <div key={f.q} className="p-5">
              <p className="font-medium text-ink">{f.q}</p>
              <p className="mt-1.5 text-sm text-ink-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
