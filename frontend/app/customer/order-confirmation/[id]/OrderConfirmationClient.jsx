'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, Package, CreditCard, AlertCircle, Copy } from 'lucide-react';
import api from '@/utils/api';

export default function OrderConfirmationClient({ id }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    api
      .get(`/orders/${id}`)
      .then((res) => {
        if (!ignore) setOrder(res.data.data);
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
  }, [id]);

  const handleCopy = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-16">
        <div className="h-24 rounded-2xl bg-surface-alt" />
        <div className="mt-6 h-64 rounded-2xl bg-surface-alt" />
      </div>
    );
  }

  if (error || !order) {
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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-local-light text-local">
          <CheckCircle2 size={32} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Order Placed Successfully!</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Thank you for your order. A confirmation has been sent to your registered email.
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-5 flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
        >
          {order.orderNumber}
          <Copy size={14} />
        </button>
        {copied && <p className="mt-1 text-xs text-local">Copied to clipboard</p>}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-raised p-5 text-center">
          <Package size={20} className="mx-auto text-primary" />
          <p className="mt-2 text-xs text-ink-muted">Estimated Delivery</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-raised p-5 text-center">
          <CreditCard size={20} className="mx-auto text-primary" />
          <p className="mt-2 text-xs text-ink-muted">Payment Method</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-raised p-5 text-center">
          <ShoppingBag size={20} className="mx-auto text-primary" />
          <p className="mt-2 text-xs text-ink-muted">Order Total</p>
          <p className="mt-1 text-sm font-semibold text-primary">NPR {order.totalAmount.toLocaleString('en-NP')}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-4 divide-y divide-border">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                <ShoppingBag size={16} className="text-primary/50" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.product?.name}</p>
                <p className="text-xs text-ink-muted">
                  Qty {item.quantity} &middot; Sold by {item.seller?.shopName}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">
                NPR {(item.price * item.quantity).toLocaleString('en-NP')}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-ink-muted">Delivering to</span>
          <span className="text-sm font-medium text-ink">{order.deliveryAddress}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-primary/5 p-5 text-sm text-ink-muted">
        <span className="font-semibold text-ink">What happens next?</span> Your order will be confirmed by
        the seller, then shipped and delivered by the estimated date above. You can track its status anytime
        from your orders page.
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href={`/customer/orders/${order.orderId}`}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Track Order
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
