'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import CartSummary from '@/components/CartSummary';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, initialized, error, updateQuantity, removeItem, clearCart } = useCart();
  const [pendingItemId, setPendingItemId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    document.title = cart.totalItems > 0 ? `Cart (${cart.totalItems}) - Nagar Bazaar` : 'Nagar Bazaar';
  }, [cart.totalItems]);

  const handleQuantityChange = async (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > item.product.stock) return;
    setPendingItemId(item.cartItemId);
    try {
      await updateQuantity(item.cartItemId, newQuantity);
    } finally {
      setPendingItemId(null);
    }
  };

  const handleRemove = async (item) => {
    if (!window.confirm(`Remove ${item.product.name} from your cart?`)) return;
    setPendingItemId(item.cartItemId);
    try {
      await removeItem(item.cartItemId);
    } finally {
      setPendingItemId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all items from your cart?')) return;
    await clearCart();
  };

  if (!user || !initialized) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
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
        <p className="mt-2 text-sm text-ink-muted">Browse the marketplace and add some products to get started.</p>
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Shopping Cart</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            Your Cart ({cart.totalItems} item{cart.totalItems === 1 ? '' : 's'})
          </h1>
        </div>
        <button type="button" onClick={handleClear} className="text-sm font-semibold text-accent-dark hover:underline">
          Clear Cart
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-raised md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Subtotal</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cart.items.map((item) => (
                  <tr key={item.cartItemId} className={pendingItemId === item.cartItemId ? 'opacity-50' : ''}>
                    <td className="px-5 py-4">
                      <Link href={`/products/${item.product._id}`} className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                          <ShoppingBag size={18} className="text-primary/50" />
                        </span>
                        <span className="font-medium text-ink hover:text-primary">{item.product.name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{item.product.sellerId?.shopName || '—'}</td>
                    <td className="px-5 py-4 text-ink-muted">NPR {item.product.price.toLocaleString('en-NP')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          disabled={pendingItemId === item.cartItemId}
                          onClick={() => handleQuantityChange(item, -1)}
                          className="flex h-8 w-8 items-center justify-center text-ink-muted hover:text-primary disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={pendingItemId === item.cartItemId || item.quantity >= item.product.stock}
                          onClick={() => handleQuantityChange(item, 1)}
                          className="flex h-8 w-8 items-center justify-center text-ink-muted hover:text-primary disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      NPR {item.subtotal.toLocaleString('en-NP')}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={pendingItemId === item.cartItemId}
                        onClick={() => handleRemove(item)}
                        className="text-ink-muted hover:text-accent-dark disabled:opacity-40"
                        aria-label="Remove item"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="space-y-4 md:hidden">
            {cart.items.map((item) => (
              <div
                key={item.cartItemId}
                className={`rounded-2xl border border-border bg-surface-raised p-4 ${
                  pendingItemId === item.cartItemId ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                    <ShoppingBag size={20} className="text-primary/50" />
                  </span>
                  <div className="flex-1">
                    <Link href={`/products/${item.product._id}`} className="font-medium text-ink">
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-muted">{item.product.sellerId?.shopName || '—'}</p>
                    <p className="mt-1 text-sm text-ink-muted">NPR {item.product.price.toLocaleString('en-NP')}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingItemId === item.cartItemId}
                    onClick={() => handleRemove(item)}
                    className="text-ink-muted hover:text-accent-dark disabled:opacity-40"
                    aria-label="Remove item"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      disabled={pendingItemId === item.cartItemId}
                      onClick={() => handleQuantityChange(item, -1)}
                      className="flex h-8 w-8 items-center justify-center text-ink-muted hover:text-primary disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={pendingItemId === item.cartItemId || item.quantity >= item.product.stock}
                      onClick={() => handleQuantityChange(item, 1)}
                      className="flex h-8 w-8 items-center justify-center text-ink-muted hover:text-primary disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-display font-semibold text-primary">
                    NPR {item.subtotal.toLocaleString('en-NP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <CartSummary subtotal={cart.totalPrice} itemCount={cart.totalItems} />
        </div>
      </div>
    </div>
  );
}
