'use client';

import { Clock3, ShieldAlert, XCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

const copy = {
  pending: {
    icon: Clock3,
    title: 'Your seller account is pending verification',
    body: 'A government officer needs to review and approve your store before you can list products, manage orders, or access your dashboard. This usually does not take long — check back soon.',
    style: 'text-accent-dark bg-accent-light',
  },
  review_required: {
    icon: ShieldAlert,
    title: 'Your seller account needs a closer review',
    body: 'An officer has flagged your store for additional review before it can go live.',
    style: 'text-accent-dark bg-accent-light',
  },
  rejected: {
    icon: XCircle,
    title: 'Your seller application was rejected',
    body: 'Please update your store details or contact support for next steps.',
    style: 'text-red-700 bg-red-100',
  },
};

export default function SellerPendingNotice({ status, reason }) {
  const { logout } = useAuth();
  const info = copy[status] || copy.pending;
  const Icon = info.icon;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${info.style}`}>
        <Icon size={26} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{info.title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{info.body}</p>
      {reason && (
        <p className="mt-4 rounded-lg bg-surface-alt px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Officer&apos;s note: </span>
          {reason}
        </p>
      )}
      <button
        type="button"
        onClick={logout}
        className="mt-8 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
      >
        Log out
      </button>
    </div>
  );
}
