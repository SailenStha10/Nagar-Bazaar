'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Store, ShieldCheck, MapPin, Star, Package } from 'lucide-react';
import api from '@/utils/api';

export default function SellersDirectoryPage() {
  const [searchInput, setSearchInput] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: 12, verified: true };
    if (location.trim()) params.location = location.trim();

    api
      .get('/sellers', { params })
      .then((res) => {
        setSellers(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      })
      .catch(() => setError('Failed to load stores. Please try again.'))
      .finally(() => setLoading(false));
  }, [page, location]);

  const filteredSellers = searchInput.trim()
    ? sellers.filter((s) => s.shopName.toLowerCase().includes(searchInput.trim().toLowerCase()))
    : sellers;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Marketplace</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Verified Stores</h1>
          <p className="mt-1 text-sm text-ink-muted">Every store here has passed government verification.</p>
        </div>
        <p className="text-sm text-ink-muted">
          {pagination.total} store{pagination.total === 1 ? '' : 's'} found
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by shop name..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="relative">
          <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={location}
            onChange={(e) => {
              setPage(1);
              setLocation(e.target.value);
            }}
            placeholder="Filter by location..."
            className="rounded-full border border-border bg-surface-raised py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Store size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No stores found</p>
            <p className="mt-1 text-sm text-ink-muted">Try a different search or location.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSellers.map((seller) => (
                <Link
                  key={seller._id}
                  href={`/sellers/${seller._id}`}
                  className="group flex flex-col rounded-2xl border border-border bg-surface-raised p-5 transition hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Store size={20} />
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
                      <ShieldCheck size={11} />
                      Verified
                    </span>
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold text-ink transition group-hover:text-primary">
                    {seller.shopName}
                  </p>
                  {seller.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin size={12} />
                      {seller.location}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-accent text-accent" />
                      {seller.ratings > 0 ? seller.ratings.toFixed(1) : 'New'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={12} />
                      {seller.productCount} product{seller.productCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </Link>
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
  );
}
