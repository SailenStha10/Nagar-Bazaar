'use client';

import useAuth from '@/hooks/useAuth';

export default function SellerDashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-3xl border border-border bg-surface-raised p-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Seller Dashboard</span>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Welcome, {user?.name || 'Seller'}</h1>
        <p className="mt-3 text-ink-muted">
          Store statistics, product management, and order handling will appear here in a later sprint.
        </p>
      </div>
    </div>
  );
}
