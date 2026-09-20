'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Tag, LayoutGrid, Search, PackageSearch } from 'lucide-react';
import api from '@/utils/api';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import ProductCard from '@/components/ProductCard';
import useMarketplaceFilters from '@/context/MarketplaceFiltersContext';

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mt-10 first:mt-0">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ProductGrid({ products, onAddToCart }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-surface-raised" />
      ))}
    </div>
  );
}

// Isolated so only this piece needs the Suspense boundary useSearchParams()
// requires for static rendering, instead of opting the whole page into it.
function SearchParamSync({ onQuery }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) onQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  return null;
}

export default function CustomerProductsLanding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const mf = useMarketplaceFilters();

  // Curated sections (sale, recommended) — rendered inside the Full
  // Marketplace section below, not as a separate "For You" page/area.
  const [recommended, setRecommended] = useState([]);
  const [sale, setSale] = useState([]);
  const [curatedLoading, setCuratedLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Full marketplace grid — search stays on the page, filters live in the
  // persistent sidebar via MarketplaceFiltersContext.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [marketProducts, setMarketProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState('');

  const filters = mf?.filters;
  const sort = mf?.sort;
  const searchInput = mf?.searchInput ?? '';

  // Tell the sidebar to render the filters panel while this page is mounted.
  useEffect(() => {
    mf?.setActive(true);
    return () => mf?.setActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    setCuratedLoading(true);
    setError('');

    Promise.all([
      api.get('/products/search', { params: { page: 1, limit: 8, sortBy: 'rating', sortOrder: 'desc' } }),
      api.get('/products/search', { params: { page: 1, limit: 8, onSale: true, sortBy: 'latest', sortOrder: 'desc' } }),
    ])
      .then(([ratedRes, saleRes]) => {
        setRecommended(ratedRes.data.data || []);
        setSale(saleRes.data.data || []);
      })
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setCuratedLoading(false));
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!user || user.role !== 'customer' || !mf) return;
    api
      .get('/categories')
      .then((res) => mf.setCategories(res.data.data || []))
      .catch(() => mf.setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'customer' || !filters || !sort) return;
    let ignore = false;
    setMarketLoading(true);
    setMarketError('');

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
        setMarketProducts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      })
      .catch(() => {
        if (!ignore) setMarketError('Failed to load products. Please try again.');
      })
      .finally(() => {
        if (!ignore) setMarketLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [user, page, sort, debouncedSearch, filters]);

  useEffect(() => {
    setPage(1);
  }, [sort, debouncedSearch, filters]);

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
      setTimeout(() => setToast(''), 2000);
    },
    [user, router, addToCart]
  );

  if (!user || user.role !== 'customer' || authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <Suspense fallback={null}>
        <SearchParamSync onQuery={(q) => mf?.setSearchInput(q)} />
      </Suspense>

      <div className="pt-10">
        <h1 className="font-display text-4xl font-bold text-ink">Welcome back, {user.name.split(' ')[0]}</h1>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>
      )}

      {/* Full Marketplace — search up top, sale & recommended picks folded
          in above the main grid, filters live in the sidebar. */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutGrid size={20} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Full Marketplace</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {pagination.total} product{pagination.total === 1 ? '' : 's'} from every verified seller
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => mf?.setSearchInput(e.target.value)}
              placeholder="Search for products, e.g. Gundruk, Rice, Honey..."
              className="w-full rounded-full border border-border bg-surface-raised py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        {curatedLoading ? (
          <div className="mt-8">
            <GridSkeleton />
          </div>
        ) : (
          <>
            {sale.length > 0 && (
              <Section icon={Tag} title="Sale & Discounted" subtitle="Limited-time lower prices set by our sellers">
                <ProductGrid products={sale} onAddToCart={handleAddToCart} />
              </Section>
            )}

            {recommended.length > 0 && (
              <Section icon={Sparkles} title="Recommended" subtitle="Top-rated products across the marketplace">
                <ProductGrid products={recommended} onAddToCart={handleAddToCart} />
              </Section>
            )}
          </>
        )}

        <div className="mt-10 border-t border-border pt-10">
          {marketError && (
            <div className="mb-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{marketError}</div>
          )}

          {marketLoading ? (
            <GridSkeleton />
          ) : marketProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <PackageSearch size={36} className="text-ink-muted" />
              <p className="mt-4 font-display text-lg font-semibold text-ink">No products found</p>
              <p className="mt-1 text-sm text-ink-muted">Try adjusting your search or filters.</p>
              {mf?.hasActiveFilters && (
                <button
                  type="button"
                  onClick={mf.clearFilters}
                  className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <ProductGrid products={marketProducts} onAddToCart={handleAddToCart} />

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
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
