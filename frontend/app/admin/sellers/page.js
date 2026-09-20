'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Store } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const statusBadge = {
  pending: 'bg-accent-light text-accent-dark',
  approved: 'bg-local-light text-local',
  rejected: 'bg-red-100 text-red-700',
  review_required: 'bg-primary/10 text-primary',
};

export default function AdminSellersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    setError('');
    const params = { page, limit: 10 };
    if (status) params.status = status;
    api
      .get('/verification/sellers', { params })
      .then((res) => {
        setSellers(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load sellers'))
      .finally(() => setLoading(false));
  }, [user, page, status]);

  const filteredSellers = searchInput.trim()
    ? sellers.filter(
        (s) =>
          s.shopName.toLowerCase().includes(searchInput.trim().toLowerCase()) ||
          (s.ownerName || '').toLowerCase().includes(searchInput.trim().toLowerCase())
      )
    : sellers;

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Seller Management</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by shop name or owner..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="review_required">Review Required</option>
        </select>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Store size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No sellers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Shop</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Products</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSellers.map((s) => (
                    <tr key={s.sellerId}>
                      <td className="px-5 py-3 font-medium text-ink">{s.shopName}</td>
                      <td className="px-5 py-3 text-ink-muted">{s.ownerName || '—'}</td>
                      <td className="px-5 py-3 text-ink-muted">{s.location || '—'}</td>
                      <td className="px-5 py-3 text-ink-muted">{s.productsCount}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[s.status]}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/government/sellers/${s.sellerId}`}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          View / Approve
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 text-sm text-ink-muted">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
