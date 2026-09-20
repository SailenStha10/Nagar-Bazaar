'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const orderStatusBadge = {
  placed: 'bg-accent-light text-accent-dark',
  confirmed: 'bg-primary/10 text-primary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-local-light text-local',
  cancelled: 'bg-surface-alt text-ink-muted',
};

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    setLoading(true);
    setError('');
    api
      .get('/orders', { params: { page, limit: 10 } })
      .then((res) => {
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (!user || user.role !== 'customer') return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">My Account</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Order History</h1>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <ShoppingBag size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No orders yet</p>
            <Link href="/products" className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Placed</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.orderId}>
                      <td className="px-5 py-3 font-medium text-ink">{o.orderNumber}</td>
                      <td className="px-5 py-3 text-ink-muted">{o.itemCount}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${orderStatusBadge[o.orderStatus]}`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-ink">NPR {o.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/customer/orders/${o.orderId}`}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          Track
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
