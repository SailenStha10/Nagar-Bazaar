'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, PackageSearch, Sparkles } from 'lucide-react';
import api from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';

const sortOptions = [
  { value: 'latest-desc', label: 'Latest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

const emptyFilters = {
  category: '',
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
};

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState('latest-desc');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [didYouMean, setDidYouMean] = useState([]);

  useEffect(() => {
    if (user?.role !== 'customer') {
      setRecommendations([]);
      return;
    }
    let ignore = false;
    api
      .get(`/recommendations/${user.userId}`, { params: { limit: 8 } })
      .then((res) => {
        if (!ignore) setRecommendations(res.data.data || []);
      })
      .catch(() => {
        if (!ignore) setRecommendations([]);
      });
    return () => {
      ignore = true;
    };
  }, [user?.userId, user?.role]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    api
      .get('/products/suggestions', { params: { q: debouncedSearch } })
      .then((res) => {
        if (!ignore) setSuggestions(res.data.data || []);
      })
      .catch(() => {
        if (!ignore) setSuggestions([]);
      });
    return () => {
      ignore = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    const [sortBy, sortOrder] = sort.split('-');
    const params = { page, limit: 12, sortBy, sortOrder };
    if (debouncedSearch) params.q = debouncedSearch;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.inStockOnly) params.inStock = true;

    api
      .get('/products/search', { params })
      .then((res) => {
        if (ignore) return;
        setProducts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
        setDidYouMean(res.data.suggestions || []);
      })
      .catch(() => {
        if (!ignore) setError('Failed to load products. Please try again.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, sort, debouncedSearch, filters]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(emptyFilters);
    setSearchInput('');
  };

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

  const hasActiveFilters =
    filters.category || filters.minPrice || filters.maxPrice || filters.inStockOnly || searchInput;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Marketplace</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Browse Products</h1>
        </div>
        <p className="text-sm text-ink-muted">
          {pagination.total} product{pagination.total === 1 ? '' : 's'} found
        </p>
      </div>

      {/* Curated picks, not search results — hide while actively searching. */}
      {!searchInput.trim() && recommendations.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="font-display text-xl font-semibold text-ink">Recommended For You</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((rec) => (
              <ProductCard key={rec.productId} product={rec.product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search for products, e.g. Gundruk, Rice, Honey..."
            className="w-full rounded-full border border-border bg-surface-raised py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg">
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearchInput(name);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-surface-alt"
                  >
                    <Search size={14} className="text-ink-muted" />
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-3 text-sm font-medium text-ink lg:hidden"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="space-y-6 rounded-2xl border border-border bg-surface-raised p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-ink">Filters</h3>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-accent-dark hover:underline">
                  Clear all
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon ? `${cat.icon} ` : ''}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Price Range (NPR)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <span className="text-ink-muted">&ndash;</span>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={filters.maxPrice || 5000}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="mt-3 w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Sort By</label>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value);
                }}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              In Stock Only
            </label>
          </div>
        </aside>

        <div>
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
              <p className="mt-4 font-display text-lg font-semibold text-ink">No products found</p>
              <p className="mt-1 text-sm text-ink-muted">Try adjusting your search or filters.</p>
              {didYouMean.length > 0 && (
                <p className="mt-3 text-sm text-ink">
                  Did you mean{' '}
                  {didYouMean.map((s, i) => (
                    <span key={s.corrected}>
                      <button
                        type="button"
                        onClick={() => setSearchInput(s.corrected)}
                        className="font-semibold text-primary hover:underline"
                      >
                        {s.corrected}
                      </button>
                      {i < didYouMean.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  ?
                </p>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
