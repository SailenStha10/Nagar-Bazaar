'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Star,
  Leaf,
  ShoppingBag,
  Minus,
  Plus,
  ShieldCheck,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import api from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';

export default function ProductDetailClient({ id }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    setQuantity(1);

    api
      .get(`/products/${id}`)
      .then((res) => {
        if (ignore) return;
        setProduct(res.data.data);
      })
      .catch(() => {
        if (!ignore) setError('Product not found or could not be loaded.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product?.seller?._id) return;
    let ignore = false;

    api
      .get('/products/search', {
        params: { seller: product.seller._id, excludeId: product._id, limit: 4 },
      })
      .then((res) => {
        if (!ignore) setRelated(res.data.data || []);
      })
      .catch(() => {
        if (!ignore) setRelated([]);
      });

    return () => {
      ignore = true;
    };
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await addToCart(product._id, quantity);
      setToast(`Added ${quantity} × ${product.name} to cart`);
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not add to cart');
    }
    setTimeout(() => setToast(''), 2500);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="h-96 rounded-3xl bg-surface-alt" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 rounded bg-surface-alt" />
            <div className="h-9 w-2/3 rounded bg-surface-alt" />
            <div className="h-24 w-full rounded bg-surface-alt" />
            <div className="h-10 w-1/2 rounded bg-surface-alt" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Product not found'}</p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const reviewCount = product.reviews?.length || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight size={13} />
        <Link href="/products" className="hover:text-primary">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={13} />
            <span>{product.category.name}</span>
          </>
        )}
        <ChevronRight size={13} />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="relative flex h-96 items-center justify-center rounded-3xl bg-linear-to-br from-primary/10 to-accent-light">
          <ShoppingBag className="text-primary/30" size={72} />
          {product.isLocal && (
            <span className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-local-light px-3 py-1.5 text-xs font-semibold text-local">
              <Leaf size={13} />
              Local Product
            </span>
          )}
        </div>

        <div>
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">
              {product.category.icon} {product.category.name}
            </span>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <div className="flex items-center gap-1">
              <Star size={15} className="fill-accent text-accent" />
              <span className="font-medium text-ink">{product.ratings?.toFixed(1) || 'New'}</span>
            </div>
            <span>&middot;</span>
            <span>{reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
          </div>

          <p className="mt-5 font-display text-3xl font-semibold text-primary">
            NPR {product.price?.toLocaleString('en-NP')}
          </p>

          <p className="mt-2 text-sm font-medium">
            {inStock ? (
              <span className="text-local">In Stock &middot; {product.stock} available</span>
            ) : (
              <span className="text-accent-dark">Out of Stock</span>
            )}
          </p>

          <p className="mt-5 text-sm leading-relaxed text-ink-muted">{product.description}</p>

          {product.isLocal && product.localProductDetails && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-local-light px-4 py-3 text-sm text-local">
              <MapPin size={16} />
              Produced by {product.localProductDetails.producer} &middot; {product.localProductDetails.location}
            </div>
          )}

          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-primary"
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-ink">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-primary"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to Cart
            </button>
          </div>

          {product.seller && (
            <Link
              href={`/sellers/${product.seller._id}`}
              className="mt-7 flex items-center gap-3 rounded-2xl border border-border p-4 transition hover:border-primary"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck size={20} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{product.seller.shopName}</span>
                <span className="text-xs text-ink-muted">
                  {product.seller.verificationStatus === 'approved' ? 'Government-verified seller' : 'Seller profile'}
                </span>
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Reviews {reviewCount > 0 && `(${reviewCount})`}
        </h2>

        {reviewCount === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No reviews yet for this product.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {product.reviews.map((review, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface-raised p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{review.user || 'Anonymous'}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <Star size={13} className="fill-accent text-accent" />
                    {review.rating}
                  </span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-ink-muted">{review.comment}</p>}
                <p className="mt-3 text-xs text-ink-muted">
                  {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink">More from {product.seller?.shopName}</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} onAddToCart={() => {}} />
            ))}
          </div>
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
