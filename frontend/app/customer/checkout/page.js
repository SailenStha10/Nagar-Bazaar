'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Truck, CreditCard, AlertCircle, CalendarDays } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 100;
const ESTIMATED_DELIVERY_DAYS = 4;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, initialized, checkout } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setDeliveryAddress(user.address || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const subtotal = cart.totalPrice;
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const estimatedDeliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + ESTIMATED_DELIVERY_DAYS);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const validate = () => {
    const nextErrors = {};
    if (deliveryAddress.trim().length < 5) nextErrors.deliveryAddress = 'Please enter a complete delivery address';
    if (phone.trim().length < 7) nextErrors.phone = 'Please enter a valid phone number';
    if (!paymentMethod) nextErrors.paymentMethod = 'Please select a payment method';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const confirmed = window.confirm(
      `Place order for NPR ${total.toLocaleString('en-NP')} with ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const order = await checkout(deliveryAddress.trim(), paymentMethod);
      router.push(`/customer/order-confirmation/${order.orderId}`);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (!user || !initialized) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface-raised" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-raised" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <ShoppingBag size={40} className="text-ink-muted" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-muted">Add some products before checking out.</p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Checkout</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Review &amp; Place Your Order</h1>

      {submitError && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>
            <div className="mt-4 divide-y divide-border">
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="flex items-center gap-3 py-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                    <ShoppingBag size={16} className="text-primary/50" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{item.product.name}</p>
                    <p className="text-xs text-ink-muted">
                      Qty {item.quantity} &times; NPR {item.price.toLocaleString('en-NP')}
                      {item.discountPercent > 0 && (
                        <>
                          {' '}
                          <span className="line-through">NPR {item.product.price.toLocaleString('en-NP')}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    NPR {item.subtotal.toLocaleString('en-NP')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              <h2 className="font-display text-lg font-semibold text-ink">Delivery Information</h2>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-ink">
                  Delivery Address
                </label>
                <textarea
                  id="deliveryAddress"
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House no., street, area, city"
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {errors.deliveryAddress && (
                  <p className="mt-1 text-xs text-accent-dark">{errors.deliveryAddress}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-ink">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {errors.phone && <p className="mt-1 text-xs text-accent-dark">{errors.phone}</p>}
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-local-light px-4 py-3 text-sm text-local">
                <CalendarDays size={16} />
                Estimated delivery: {estimatedDeliveryDate}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <h2 className="font-display text-lg font-semibold text-ink">Payment Method</h2>
            </div>

            <div className="mt-4 space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Cash on Delivery</span>
                  <span className="block text-xs text-ink-muted">Pay in cash when your order arrives.</span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Online Payment</span>
                  <span className="block text-xs text-ink-muted">Demo gateway &mdash; no real charge is made.</span>
                </span>
              </label>

              {paymentMethod === 'online' && (
                <div className="rounded-lg border border-dashed border-border bg-surface-alt px-4 py-3 text-xs text-ink-muted">
                  This is a demo checkout. Online payment details are not collected; the order will be created
                  with payment marked as pending.
                </div>
              )}
              {errors.paymentMethod && <p className="text-xs text-accent-dark">{errors.paymentMethod}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-border bg-surface-raised p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Price Details</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal ({cart.totalItems} item{cart.totalItems === 1 ? '' : 's'})</span>
                <span className="font-medium text-ink">NPR {subtotal.toLocaleString('en-NP')}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Delivery Fee</span>
                <span className="font-medium text-ink">
                  {deliveryFee === 0 ? 'Free' : `NPR ${deliveryFee.toLocaleString('en-NP')}`}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-display font-semibold text-ink">Total</span>
              <span className="font-display text-xl font-semibold text-primary">
                NPR {total.toLocaleString('en-NP')}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
            <Link
              href="/customer/cart"
              className="mt-3 block text-center text-sm font-semibold text-ink-muted hover:text-primary"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
