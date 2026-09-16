'use client';

import Link from 'next/link';
import { Leaf, Star, MapPin } from 'lucide-react';

export default function LocalProductCard({ product, onAddToCart }) {
  const inStock = product.stock > 0;
  const details = product.localProductDetails;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition hover:shadow-lg">
      <Link href={`/products/${product._id}`} className="relative block">
        <div className="flex h-40 items-center justify-center bg-linear-to-br from-local-light to-accent-light">
          <Leaf className="text-local/50" size={32} />
        </div>
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
          <Leaf size={11} />
          Local Product
        </span>
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

        <div className="mt-3">
          <span className="font-display text-lg font-semibold text-primary">
            NPR {product.price?.toLocaleString('en-NP')}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={!inStock}
            className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to Cart
          </button>
          <Link
            href={`/products/${product._id}`}
            className="flex-1 rounded-full border border-border py-2 text-center text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
