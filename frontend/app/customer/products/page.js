'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Tag, LayoutGrid, PackageSearch, ShoppingBag } from 'lucide-react';
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
  // Marketplace section below, not as a separate "For You" page/area. Capped
  // to 4 items each; "View All Sale Products" hands off to the All Products
  // grid below instead of growing this section.
  const CURATED_LIMIT = 4;
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
  const [saleOnly, setSaleOnly] = useState(false);

  // Browsing (no search) is capped at 40 products so the catalog stays
  // skimmable; a search still reaches the full catalog beyond that cap.
  const ALL_PRODUCTS_CAP = 40;
  const isCapped = !debouncedSearch && !saleOnly;
  const cappedTotal = isCapped ? Math.min(pagination.total, ALL_PRODUCTS_CAP) : pagination.total;
  const cappedPages = Math.ceil(cappedTotal / pagination.limit) || 1;
  const visibleMarketProducts = isCapped
    ? marketProducts.slice(0, Math.max(0, ALL_PRODUCTS_CAP - (page - 1) * pagination.limit))
    : marketProducts;

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

  // Recommended pulls from the real per-user recommendation engine (order
  // history driven, see /api/recommendations), so it reflects what the
  // customer has actually done and comes back fresh on every visit rather
  // than a static "top rated" list. New customers with no order history yet
  // get nothing back from that engine, so top-rated products fill in.
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    setCuratedLoading(true);
    setError('');

    Promise.all([
      api.get(`/recommendations/${user.userId}`, { params: { limit: CURATED_LIMIT } }),
      api.get('/products/search', { params: { page: 1, limit: CURATED_LIMIT, onSale: true, sortBy: 'latest', sortOrder: 'desc' } }),
    ])
      .then(async ([recRes, saleRes]) => {
        const recs = (recRes.data.data || []).map((r) => r.product).filter(Boolean);
        if (recs.length > 0) {
          setRecommended(recs);
        } else {
          const fallback = await api.get('/products/search', { params: { page: 1, limit: CURATED_LIMIT, sortBy: 'rating', sortOrder: 'desc' } });
          setRecommended(fallback.data.data || []);
        }
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
    if (saleOnly) params.onSale = true;

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
  }, [user, page, sort, debouncedSearch, filters, saleOnly]);

  useEffect(() => {
    setPage(1);
  }, [sort, debouncedSearch, filters, saleOnly]);

  const handleViewAllSale = () => {
    setSaleOnly(true);
    setPage(1);
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      {/* Full Marketplace — search lives in the top bar (see Navbar's
          customer-dashboard search field), sale & recommended picks folded
          in above the main grid, filters live in the sidebar. */}
      <section id="marketplace" className="mt-10">
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

        {/* Sale & Recommended are curated picks, not search results — hide
            them while the customer is actively searching so the page shows
            only what they searched for, and bring them back once the
            search box is cleared. */}
        {!searchInput.trim() &&
          (curatedLoading ? (
            <div className="mt-8">
              <GridSkeleton />
            </div>
          ) : (
            <>
              {sale.length > 0 && (
                <Section icon={Tag} title="Sale & Discounted" subtitle="Limited-time lower prices set by our sellers">
                  <ProductGrid products={sale} onAddToCart={handleAddToCart} />
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={handleViewAllSale}
                      className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      View All Sale Products
                    </button>
                  </div>
                </Section>
              )}

              {recommended.length > 0 && (
                <Section icon={Sparkles} title="Recommended" subtitle="Picked for you based on your activity">
                  <ProductGrid products={recommended} onAddToCart={handleAddToCart} />
                </Section>
              )}
            </>
          ))}

        <div className="mt-10 border-t border-border pt-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBag size={18} />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {debouncedSearch ? 'Search Results' : saleOnly ? 'Sale Products' : 'All Products'}
                </h3>
                <p className="text-xs text-ink-muted">
                  {cappedTotal} product{cappedTotal === 1 ? '' : 's'}
                  {isCapped && pagination.total > ALL_PRODUCTS_CAP ? ` of ${pagination.total} — search to see more` : ''}
                </p>
              </div>
            </div>
            {saleOnly && !debouncedSearch && (
              <button
                type="button"
                onClick={() => {
                  setSaleOnly(false);
                  setPage(1);
                }}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
              >
                Show All Products
              </button>
            )}
          </div>

          {marketError && (
            <div className="mt-5 mb-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{marketError}</div>
          )}

          <div className="mt-5">
            {marketLoading ? (
              <GridSkeleton />
            ) : visibleMarketProducts.length === 0 ? (
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
                <ProductGrid products={visibleMarketProducts} onAddToCart={handleAddToCart} />

                {cappedPages > 1 && (
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
                      Page {pagination.page} of {cappedPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= cappedPages}
                      onClick={() => setPage((p) => Math.min(cappedPages, p + 1))}
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
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
