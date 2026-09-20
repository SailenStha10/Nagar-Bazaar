'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Megaphone, ShoppingBag, Info, FileWarning, Scale, DollarSign } from 'lucide-react';
import api from '@/utils/api';

const categoryMeta = {
  market_info: { label: 'Market Info', icon: ShoppingBag },
  consumer_awareness: { label: 'Consumer Awareness', icon: Info },
  public_notice: { label: 'Public Notice', icon: FileWarning },
  regulations: { label: 'Regulations', icon: Scale },
  price_info: { label: 'Price Info', icon: DollarSign },
};

const priorityBadge = {
  high: 'bg-accent-dark text-white',
  medium: 'bg-accent-light text-accent-dark',
  low: 'bg-surface-alt text-ink-muted',
};

export default function NoticesPage() {
  return (
    <Suspense fallback={null}>
      <NoticesFeed />
    </Suspense>
  );
}

function NoticesFeed() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);

  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const [sortBy, sortOrder] = sort.split('-');
    const params = { page, limit: 10, sortBy, sortOrder };
    if (category) params.category = category;
    if (priority) params.priority = priority;
    if (debouncedSearch) params.q = debouncedSearch;

    api
      .get('/notices', { params })
      .then((res) => {
        setNotices(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load notices'))
      .finally(() => setLoading(false));
  }, [page, category, priority, sort, debouncedSearch]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Government Notices</h1>
      <p className="mt-1 text-sm text-ink-muted">Official announcements, regulations, and market updates.</p>

      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setPage(1);
              setSearchInput(e.target.value);
            }}
            placeholder="Search notices..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All Categories</option>
            {Object.entries(categoryMeta).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => {
              setPage(1);
              setPriority(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="date-desc">Latest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="priority-desc">By Priority</option>
          </select>
        </div>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Megaphone size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No notices found</p>
            <p className="mt-1 text-sm text-ink-muted">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {notices.map((n) => {
                const meta = categoryMeta[n.category] || categoryMeta.public_notice;
                return (
                  <Link
                    key={n.noticeId}
                    href={`/notices/${n.noticeId}`}
                    className="block rounded-2xl border border-border bg-surface-raised p-6 transition hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted">
                        <meta.icon size={12} />
                        {meta.label}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityBadge[n.priority]}`}>
                        {n.priority} priority
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-semibold text-ink">{n.title}</h2>
                    <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{n.content}</p>
                    <p className="mt-3 text-xs text-ink-muted">
                      {n.issuedBy?.name ? `${n.issuedBy.name} · ` : ''}
                      {new Date(n.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Link>
                );
              })}
            </div>

            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
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
