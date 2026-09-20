'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Percent, ShoppingBag, Check } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import { computeDiscount } from '@/utils/discount';

export default function SellerOffersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = () => {
    if (!user || user.role !== 'seller') return;
    setLoading(true);
    setError('');
    const params = { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' };
    if (debouncedSearch) params.q = debouncedSearch;

    api
      .get('/sellers/products', { params })
      .then((res) => {
        const data = res.data.data || [];
        setProducts(data);
        setDrafts(
          Object.fromEntries(
            data.map((p) => [p._id, { discountType: p.discountType || 'none', discountValue: p.discountValue || '' }])
          )
        );
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, debouncedSearch]);

  const updateDraft = (id, key, value) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const handleSave = async (product) => {
    const draft = drafts[product._id];
    setSavingId(product._id);
    setError('');
    try {
      const res = await api.put(`/sellers/products/${product._id}`, {
        discountType: draft.discountType,
        discountValue: draft.discountType === 'none' ? 0 : Number(draft.discountValue) || 0,
      });
      setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.data : p)));
      setSavedId(product._id);
      setTimeout(() => setSavedId(null), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update offer');
    } finally {
      setSavingId(null);
    }
  };

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Percent size={20} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Promotions</span>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Offers</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-muted">Set a discount on any product to feature it in the marketplace&apos;s Sale &amp; Discounted section.</p>

      <div className="relative mt-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search your products..."
          className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-ink-muted">
            No products found.
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-raised">
            {products.map((product) => {
              const draft = drafts[product._id] || { discountType: 'none', discountValue: '' };
              const { discountPercent, discountedPrice } = computeDiscount(product);
              return (
                <div key={product._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light">
                    <ShoppingBag size={16} className="text-primary/50" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                    <p className="text-xs text-ink-muted">
                      NPR {product.price.toLocaleString('en-NP')}
                      {discountPercent > 0 && (
                        <span className="ml-1.5 font-semibold text-local">
                          &rarr; NPR {discountedPrice.toLocaleString('en-NP')} (-{discountPercent}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <select
                    value={draft.discountType}
                    onChange={(e) => updateDraft(product._id, 'discountType', e.target.value)}
                    className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs outline-none focus:border-primary"
                  >
                    <option value="none">No discount</option>
                    <option value="percentage">Percentage off</option>
                    <option value="flat">Flat sale price</option>
                  </select>
                  {draft.discountType !== 'none' && (
                    <input
                      type="number"
                      min="0"
                      placeholder={draft.discountType === 'percentage' ? '% off' : 'Sale price'}
                      value={draft.discountValue}
                      onChange={(e) => updateDraft(product._id, 'discountValue', e.target.value)}
                      className="w-28 shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  )}
                  <button
                    type="button"
                    disabled={savingId === product._id}
                    onClick={() => handleSave(product)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savedId === product._id ? <Check size={14} /> : null}
                    {savingId === product._id ? 'Saving...' : savedId === product._id ? 'Saved' : 'Save'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
