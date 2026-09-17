'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  PackageSearch,
  ArrowRight,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import OrderTimeline from '@/components/OrderTimeline';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'amount-desc', label: 'Amount: High to Low' },
  { value: 'amount-asc', label: 'Amount: Low to High' },
];

const statusBadge = {
  placed: 'bg-accent-light text-accent-dark',
  confirmed: 'bg-primary/10 text-primary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-local-light text-local',
  cancelled: 'bg-surface-alt text-ink-muted',
};

const STATUS_SEQUENCE = ['placed', 'confirmed', 'shipped', 'delivered'];

const trackTimelineFromOrder = (order) => {
  const timelineByStatus = Object.fromEntries((order.timeline || []).map((t) => [t.status, t.timestamp]));
  return STATUS_SEQUENCE.map((status) => ({
    status,
    timestamp: timelineByStatus[status] || null,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }));
};

function OrderDetailModal({ orderId, onClose, onStatusUpdated }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    api
      .get(`/sellers/orders/${orderId}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const nextStatus = order ? STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(order.orderStatus) + 1] : null;

  const handleUpdate = async () => {
    if (!nextStatus) return;
    if (!window.confirm(`Mark this order as "${nextStatus}"?`)) return;
    setUpdating(true);
    try {
      await api.put(`/sellers/orders/${orderId}/status`, { status: nextStatus });
      loadOrder();
      onStatusUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-8">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Order Details</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-surface-alt">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-surface-alt" />
        ) : error && !order ? (
          <p className="mt-6 text-sm text-accent-dark">{error}</p>
        ) : (
          order && (
            <div className="mt-5 space-y-6">
              {error && <div className="rounded-lg bg-accent-light px-4 py-2.5 text-sm text-accent-dark">{error}</div>}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{order.orderNumber}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[order.orderStatus]}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Customer</h3>
                <div className="mt-2 space-y-1.5 text-sm text-ink">
                  <p className="font-medium">{order.customer.name}</p>
                  {order.customer.phone && (
                    <p className="flex items-center gap-1.5 text-ink-muted">
                      <Phone size={13} /> {order.customer.phone}
                    </p>
                  )}
                  {order.customer.email && (
                    <p className="flex items-center gap-1.5 text-ink-muted">
                      <Mail size={13} /> {order.customer.email}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-ink-muted">
                    <MapPin size={13} /> {order.deliveryAddress}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Items</h3>
                <div className="mt-2 divide-y divide-border">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                        <ShoppingBag size={15} className="text-primary/50" />
                      </span>
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-ink">{item.product?.name}</p>
                        <p className="text-xs text-ink-muted">
                          Qty {item.quantity} &times; NPR {item.price.toLocaleString('en-NP')}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        NPR {(item.price * item.quantity).toLocaleString('en-NP')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Timeline</h3>
                <div className="mt-3">
                  <OrderTimeline timeline={trackTimelineFromOrder(order)} currentStatus={order.orderStatus} />
                </div>
              </div>

              {nextStatus && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {updating ? 'Updating...' : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
                  {!updating && <ArrowRight size={15} />}
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const loadOrders = () => {
    if (!user || user.role !== 'seller') return;
    setLoading(true);
    setError('');
    const [sortBy, sortOrder] = sort.split('-');
    const params = { page, limit: 10, sortBy, sortOrder };
    if (status) params.status = status;

    api
      .get('/sellers/orders', { params })
      .then((res) => {
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, sort, status]);

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Orders</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Order Management</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <PackageSearch size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No orders found</p>
            <p className="mt-1 text-sm text-ink-muted">Orders containing your products will appear here.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-raised md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="px-5 py-3 font-medium text-ink">{order.orderNumber}</td>
                      <td className="px-5 py-3 text-ink-muted">{order.customerName}</td>
                      <td className="px-5 py-3 text-ink-muted">{order.itemsForThisSeller}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[order.orderStatus]}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">
                        NPR {order.totalAmount.toLocaleString('en-NP')}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.orderId)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {orders.map((order) => (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => setSelectedOrderId(order.orderId)}
                  className="block w-full rounded-2xl border border-border bg-surface-raised p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{order.orderNumber}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[order.orderStatus]}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-muted">{order.customerName}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{order.itemsForThisSeller} items</span>
                    <span className="font-semibold text-primary">NPR {order.totalAmount.toLocaleString('en-NP')}</span>
                  </div>
                </button>
              ))}
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

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={loadOrders}
        />
      )}
    </div>
  );
}
