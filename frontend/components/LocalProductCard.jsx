'use client';

import Link from 'next/link';
import { Leaf, Star, MapPin, Heart } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useWishlist from '@/hooks/useWishlist';

export default function LocalProductCard({ product, onAddToCart }) {
  const inStock = product.stock > 0;
  const details = product.localProductDetails;
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = user?.role === 'customer' && isWishlisted(product._id);

  const discountPercent = product.discountPercent || 0;
  const hasDiscount = discountPercent > 0;
  const discountedPrice = hasDiscount ? product.discountedPrice : product.price;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all duration-300 ease-out hover:-translate-y-1 hover:border-local/30 hover:shadow-xl">
      <Link href={`/products/${product._id}`} className="relative block">
        <div className="flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-local-light to-accent-light">
          <Leaf className="text-local/50 transition-transform duration-300 ease-out group-hover:scale-110" size={32} />
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="rounded-full bg-accent-dark px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
            <Leaf size={11} />
            Local Product
          </span>
        </div>

        {user?.role === 'customer' && (
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-sm transition-all duration-200 ease-out hover:scale-110 hover:text-accent-dark"
          >
            <Heart size={15} className={wishlisted ? 'fill-accent-dark text-accent-dark' : ''} />
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product._id}`}>
          <p className="font-display font-semibold text-ink transition group-hover:text-primary">
            {product.name}
          </p>
        </Link>

        {details?.producer && (
          <p className="mt-1 text-xs font-medium text-ink-muted">{details.producer}</p>
        )}
        {details?.location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={11} />
            {details.location}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <Star size={13} className="fill-accent text-accent" />
            {product.ratings ? product.ratings.toFixed(1) : 'New'}
          </span>
          {product.seller?.shopName && <span>{product.seller.shopName}</span>}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-primary">
            NPR {discountedPrice?.toLocaleString('en-NP')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-ink-muted line-through">
              NPR {product.price?.toLocaleString('en-NP')}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={!inStock}
            className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            Add to Cart
          </button>
          <Link
            href={`/products/${product._id}`}
            className="flex-1 rounded-full border border-border py-2 text-center text-xs font-semibold text-ink transition-all duration-200 ease-out hover:scale-[1.02] hover:border-primary hover:text-primary active:scale-95"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
