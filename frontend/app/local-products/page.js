'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, MapPin, ShieldCheck, Sprout, PackageSearch } from 'lucide-react';
import api from '@/utils/api';
import LocalProductCard from '@/components/LocalProductCard';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';

const sortOptions = [
  { value: 'latest-desc', label: 'Latest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

const aboutPoints = [
  {
    icon: Sprout,
    title: 'Sourced from Producers',
    description: 'Every listing names the actual producer and district of origin, verified against seller records.',
  },
  {
    icon: ShieldCheck,
    title: 'Government-Verified Sellers',
    description: 'Local products are only listed by officer-approved sellers, so authenticity is checked, not assumed.',
  },
  {
    icon: MapPin,
    title: 'Traceable Origin',
    description: 'Filter by district to find products from a specific region of Nepal you trust.',
  },
];

export default function LocalProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [allLocal, setAllLocal] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [location, setLocation] = useState('');
  const [producer, setProducer] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('latest-desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Fetch the full local-product set once, to derive filter option lists.
  useEffect(() => {
    api
      .get('/products/search', { params: { isLocal: true, limit: 100 } })
      .then((res) => setAllLocal(res.data.data || []))
      .catch(() => setAllLocal([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    const [sortBy, sortOrder] = sort.split('-');
    const params = { isLocal: true, page, limit: 12, sortBy, sortOrder };
    if (location) params.location = location;
    if (producer) params.producer = producer;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    api
      .get('/products/search', { params })
      .then((res) => {
        if (ignore) return;
        setProducts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      })
      .catch(() => {
        if (!ignore) setError('Failed to load local products. Please try again.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [location, producer, minPrice, maxPrice, sort, page]);

  const locations = [...new Set(allLocal.map((p) => p.localProductDetails?.location).filter(Boolean))].sort();
  const producers = [...new Set(allLocal.map((p) => p.localProductDetails?.producer).filter(Boolean))].sort();
  const hasActiveFilters = location || producer || minPrice || maxPrice;

  const updateAndResetPage = (setter) => (value) => {
    setPage(1);
    setter(value);
  };

  const clearFilters = () => {
    setPage(1);
    setLocation('');
    setProducer('');
    setMinPrice('');
    setMaxPrice('');
  };

  const handleAddToCart = async (product) => {
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
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-local px-4 py-16 text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium">
            <Leaf size={14} />
            Authentic &amp; Traceable
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">Local Products of Nepal</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">
            Discover genuine Nepali goods sourced directly from producers across the country &mdash;
            every listing names its origin, and every seller is government-verified.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface-raised p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Location</label>
            <select
              value={location}
              onChange={(e) => updateAndResetPage(setLocation)(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Producer</label>
            <select
              value={producer}
              onChange={(e) => updateAndResetPage(setProducer)(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">All Producers</option>
              {producers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Min Price</label>
            <input
              type="number"
              min="0"
              placeholder="NPR 0"
              value={minPrice}
              onChange={(e) => updateAndResetPage(setMinPrice)(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Max Price</label>
            <input
              type="number"
              min="0"
              placeholder="NPR 5000"
              value={maxPrice}
              onChange={(e) => updateAndResetPage(setMaxPrice)(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Sort By</label>
            <select
              value={sort}
              onChange={(e) => updateAndResetPage(setSort)(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-accent-dark hover:underline"
          >
            Clear all filters
          </button>
        )}

        {/* Grid */}
        <div className="mt-8">
          {error && (
            <div className="mb-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface-raised">
                  <div className="h-40 bg-surface-alt" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-surface-alt" />
                    <div className="h-3 w-1/2 rounded bg-surface-alt" />
                    <div className="h-8 w-full rounded bg-surface-alt" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <PackageSearch size={36} className="text-ink-muted" />
              <p className="mt-4 font-display text-lg font-semibold text-ink">No local products found</p>
              <p className="mt-1 text-sm text-ink-muted">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <LocalProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-sm text-ink-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* About */}
      <section className="bg-surface-alt px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-local">About Local Products</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
              Why buy local on Nagar Bazaar?
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {aboutPoints.map((point) => (
              <div key={point.title} className="rounded-2xl border border-border bg-surface-raised p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-local-light text-local">
                  <point.icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
