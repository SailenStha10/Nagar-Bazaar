'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Printer,
  MessageSquareWarning,
  Phone,
  AlertCircle,
  Package,
} from 'lucide-react';
import api from '@/utils/api';
import useAuth from '@/hooks/useAuth';
import OrderTimeline from '@/components/OrderTimeline';

export default function OrderTrackingClient({ id }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    setLoading(true);
    setError('');

    Promise.all([api.get(`/orders/${id}`), api.get(`/orders/${id}/track`)])
      .then(([orderRes, trackRes]) => {
        if (ignore) return;
        setOrder(orderRes.data.data);
        setTrack(trackRes.data.data);
      })
      .catch(() => {
        if (!ignore) setError('Order not found.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, user]);

  if (!user || loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="h-8 w-64 rounded bg-surface-alt" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          <div className="h-72 rounded-2xl border border-border bg-surface-raised" />
          <div className="h-96 rounded-2xl border border-border bg-surface-raised" />
        </div>
      </div>
    );
  }

  if (error || !order || !track) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Order not found'}</p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 print:max-w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Order Tracking</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
          >
            <Printer size={15} />
            Print Receipt
          </button>
          <Link
            href={`/customer/complaints/new?orderId=${order.orderId}`}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm font-semibold text-accent-dark hover:border-accent"
          >
            <MessageSquareWarning size={15} />
            Report Issue
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Status</h2>
            <div className="mt-5">
              <OrderTimeline timeline={track.timeline} currentStatus={track.currentStatus} />
            </div>
          </div>

          {/* Order details */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Order Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Order Number</dt>
                <dd className="font-medium text-ink">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery Address</dt>
                <dd className="max-w-[60%] text-right font-medium text-ink">{order.deliveryAddress}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Payment Method</dt>
                <dd className="font-medium text-ink">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Payment Status</dt>
                <dd className="font-medium capitalize text-ink">{order.paymentStatus}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <Package size={14} />
                  Estimated Delivery
                </dt>
                <dd className="font-medium text-ink">
                  {new Date(track.estimatedDelivery).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Items ({order.items.length})
            </h2>
            <span className="font-display text-lg font-semibold text-primary">
              NPR {order.totalAmount.toLocaleString('en-NP')}
            </span>
          </div>

          <div className="mt-4 divide-y divide-border">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start gap-4 py-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                  <ShoppingBag size={20} className="text-primary/50" />
                </span>
                <div className="flex-1">
                  <Link
                    href={`/products/${item.product?._id}`}
                    className="text-sm font-semibold text-ink hover:text-primary"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink-muted">
                    Qty {item.quantity} &times; NPR {item.price.toLocaleString('en-NP')}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                    <span>Sold by {item.seller?.shopName}</span>
                    {item.seller?.contact && (
                      <a
                        href={`tel:${item.seller.contact}`}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline print:hidden"
                      >
                        <Phone size={11} />
                        Contact Seller
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink">
                  NPR {(item.price * item.quantity).toLocaleString('en-NP')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
