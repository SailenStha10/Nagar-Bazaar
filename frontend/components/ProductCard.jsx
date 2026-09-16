'use client';

import Link from 'next/link';
import { Leaf, Star, ShoppingBag, PackageX } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  const inStock = product.stock > 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition hover:shadow-lg">
      <Link href={`/products/${product._id}`} className="relative block">
        <div className="flex h-40 items-center justify-center bg-linear-to-br from-primary/10 to-accent-light">
          <ShoppingBag className="text-primary/40" size={32} />
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isLocal && (
            <span className="flex items-center gap-1 rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
              <Leaf size={11} />
              Local
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          {!inStock ? (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-accent-dark">
              <PackageX size={11} />
              Out of stock
            </span>
          ) : product.stock <= 5 ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-accent-dark">
              Low stock
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product._id}`}>
          <p className="font-display font-semibold text-ink transition group-hover:text-primary">
            {product.name}
          </p>
        </Link>
        {product.seller?.shopName && (
          <p className="mt-0.5 text-xs text-ink-muted">{product.seller.shopName}</p>
        )}

        <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
          <Star size={13} className="fill-accent text-accent" />
          {product.ratings ? product.ratings.toFixed(1) : 'New'}
        </div>

        <div className="mt-3 flex items-center justify-between">
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
