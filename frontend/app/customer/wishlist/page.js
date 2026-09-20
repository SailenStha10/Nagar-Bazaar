'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import useWishlist from '@/hooks/useWishlist';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items } = useWishlist();
  const { addToCart } = useCart();
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleAddToCart = useCallback(
    async (product) => {
      try {
        await addToCart(product._id, 1);
        setToast(`${product.name} added to cart`);
      } catch (err) {
        setToast(err.response?.data?.message || 'Could not add to cart');
      }
      setTimeout(() => setToast(''), 2000);
    },
    [addToCart]
  );

  if (!user || user.role !== 'customer' || authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-14">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Saved For Later</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">My Wishlist</h1>
      <p className="mt-1 text-sm text-ink-muted">{items.length} item{items.length === 1 ? '' : 's'} saved</p>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <Heart size={28} className="text-ink-muted" />
          <p className="mt-3 text-sm text-ink-muted">Your wishlist is empty.</p>
          <Link
            href="/customer/products"
            className="mt-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark"
          >
            <ShoppingBag size={15} />
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
