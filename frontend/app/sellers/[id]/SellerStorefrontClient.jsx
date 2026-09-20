'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, MapPin, Phone, ShieldCheck, Star, Package, PackageSearch } from 'lucide-react';
import api from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';

export default function SellerStorefrontClient({ id }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([api.get(`/sellers/${id}`), api.get('/products', { params: { seller: id, limit: 24 } })])
      .then(([sellerRes, productsRes]) => {
        setSeller(sellerRes.data.data);
        setProducts(productsRes.data.data || []);
      })
      .catch(() => setError('Store not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = useCallback(
    async (product) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        await addToCart(product._id, 1);
        setToast(`${product.name} added to cart`);
      } catch (err) {
        setToast(err.response?.data?.message || 'Could not add to cart');
      }
      setTimeout(() => setToast(''), 2500);
    },
    [user, router, addToCart]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-surface-raised" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-surface-raised" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Store not found'}</p>
        <Link href="/sellers" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Back to Stores
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/sellers" className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-primary">
        <ArrowLeft size={15} />
        Back to Stores
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-surface-raised p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package size={26} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold text-ink">{seller.shopName}</h1>
                {seller.verificationStatus === 'approved' && (
                  <span className="flex items-center gap-1 rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
                    <ShieldCheck size={11} />
                    Government-Verified
                  </span>
                )}
              </div>
              {seller.description && <p className="mt-2 max-w-xl text-sm text-ink-muted">{seller.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                {seller.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {seller.location}
                  </span>
                )}
                {seller.contact && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {seller.contact}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={12} className="fill-accent text-accent" />
                  {seller.ratings > 0 ? `${seller.ratings.toFixed(1)} rating` : 'No ratings yet'}
                </span>
                <span>{seller.totalOrders} orders fulfilled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-ink">Products from this store</h2>

      {products.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <PackageSearch size={36} className="text-ink-muted" />
          <p className="mt-4 font-display text-lg font-semibold text-ink">No products listed yet</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
