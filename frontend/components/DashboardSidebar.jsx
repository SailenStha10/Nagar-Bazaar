'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { dashboardNav } from '@/utils/dashboardNav';
import useMarketplaceFilters from '@/context/MarketplaceFiltersContext';

const sortOptions = [
  { value: 'latest-desc', label: 'Latest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

// Renders the marketplace filter controls (category, price, sort, in-stock)
// directly inside the sidebar instead of a separate aside on the products
// page — shared state lives in MarketplaceFiltersContext.
function MarketplaceFiltersPanel() {
  const mf = useMarketplaceFilters();
  if (!mf?.active) return null;

  const { filters, updateFilter, clearFilters, hasActiveFilters, sort, setSort, categories } = mf;

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center justify-between px-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          <SlidersHorizontal size={12} />
          Filters
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-[11px] font-semibold text-accent-dark hover:underline">
            Clear
          </button>
        )}
      </div>

      <div className="px-2">
        <label className="block text-xs font-medium text-ink-muted">Category</label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs outline-none focus:border-primary"
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

      <div className="px-2">
        <label className="block text-xs font-medium text-ink-muted">Price Range (NPR)</label>
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          />
          <span className="text-ink-muted">&ndash;</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="px-2">
        <label className="block text-xs font-medium text-ink-muted">Sort By</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs outline-none focus:border-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 px-2 text-xs text-ink">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
          className="h-3.5 w-3.5 accent-primary"
        />
        In Stock Only
      </label>
    </div>
  );
}

function Logo({ className = '' }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-white shadow-sm">
        N
      </span>
      <span className="font-display text-base font-semibold tracking-tight text-ink">Nagar Bazaar</span>
    </Link>
  );
}

export default function DashboardSidebar({ role }) {
  const pathname = usePathname();
  const groups = dashboardNav[role] || [];
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mf = useMarketplaceFilters();

  const flatItems = groups.flatMap((g) => g.items);
  const showMobileFilters = role === 'customer' && mf?.active;

  return (
    <>
      {/* Mobile: logo + horizontal quick-action chips */}
      <div className="lg:hidden">
        <Logo className="mb-3" />
        <div className="mb-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {flatItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface-raised text-ink hover:border-primary hover:text-primary'
                }`}
              >
                <item.icon size={13} />
                {item.label}
              </Link>
            );
          })}
          {showMobileFilters && (
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                mobileFiltersOpen
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface-raised text-ink hover:border-primary hover:text-primary'
              }`}
            >
              <SlidersHorizontal size={13} />
              Filters
            </button>
          )}
        </div>

        {showMobileFilters && mobileFiltersOpen && (
          <div className="mb-5 rounded-2xl border border-border bg-surface-raised p-4">
            <MarketplaceFiltersPanel />
          </div>
        )}
      </div>

      {/* Desktop: solid sidebar — stays pinned in the viewport while the page
          scrolls (position: sticky), but genuinely ends once its column runs
          out of room, right before the footer starts, so it never overlaps
          the footer in either direction (no z-index masking needed). */}
      <aside className="hidden w-72 shrink-0 lg:block lg:self-start lg:sticky lg:top-24">
        <div className="max-h-[calc(100vh-7rem)] w-72 space-y-6 overflow-y-auto rounded-2xl border border-border bg-surface-raised p-4 shadow-sm">
          <Logo className="px-2" />

          <div className="-mt-2 px-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Quick Actions</p>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                {group.title}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                        active
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-ink hover:translate-x-0.5 hover:bg-surface-alt hover:text-primary'
                      }`}
                    >
                      <item.icon
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 ${
                          active ? 'text-white' : 'text-ink-muted group-hover:text-primary'
                        }`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {role === 'customer' && <MarketplaceFiltersPanel />}
        </div>
      </aside>
    </>
  );
}
