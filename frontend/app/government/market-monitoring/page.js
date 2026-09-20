'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import DashboardStatCard from '@/components/DashboardStatCard';

const statusBadge = {
  normal: 'bg-local-light text-local',
  review_required: 'bg-accent-dark text-white',
};

export default function MarketMonitoringPage() {
  return (
    <Suspense fallback={null}>
      <MarketMonitoring />
    </Suspense>
  );
}

function MarketMonitoring() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('product');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [prices, setPrices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    api.get('/market-monitoring/analytics').then((res) => setAnalytics(res.data.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    setLoading(true);
    setError('');
    const params = { page, limit: 10, sortBy };
    if (category) params.category = category;
    if (status) params.status = status;

    api
      .get('/market-monitoring/prices', { params })
      .then((res) => {
        setPrices(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load prices'))
      .finally(() => setLoading(false));
  }, [user, page, category, status, sortBy]);

  const filteredPrices = searchInput.trim()
    ? prices.filter((p) => (p.product?.name || '').toLowerCase().includes(searchInput.trim().toLowerCase()))
    : prices;

  const categoryChartData = analytics ? Object.entries(analytics.pricesByCategory).map(([name, v]) => ({ name, ...v })) : [];

  if (!user || !['officer', 'admin'].includes(user.role)) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Market Price Monitoring</h1>
      <p className="mt-1 text-sm text-ink-muted">Track seller pricing against market averages and flag deviations.</p>

      {analytics && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardStatCard title="Prices Under Review" value={analytics.pricesUnderReview} icon={AlertTriangle} color="accent" />
          <DashboardStatCard title="Average Deviation" value={`${analytics.averagePriceDeviation}%`} icon={TrendingUp} color="primary" />
          <div className="rounded-2xl border border-border bg-surface-raised p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Most Overpriced</p>
            <div className="mt-3 space-y-1.5">
              {analytics.mostOverpriced.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-ink">{p.product}</span>
                  <span className="font-semibold text-accent-dark">+{p.deviation}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analytics && categoryChartData.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Average Deviation by Category</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Bar dataKey="avgDeviation" fill="#0f2c4c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by product name..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="normal">Normal</option>
          <option value="review_required">Review Required</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => {
            setPage(1);
            setSortBy(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="product">Sort: Product</option>
          <option value="averagePrice">Sort: Avg. Price</option>
          <option value="deviation">Sort: Deviation</option>
        </select>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <TrendingUp size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No price records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Seller</th>
                    <th className="px-5 py-3">Current Price</th>
                    <th className="px-5 py-3">Avg. Market Price</th>
                    <th className="px-5 py-3">Deviation</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPrices.map((p) => (
                    <tr key={p.priceId}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{p.product?.name}</p>
                        <p className="text-xs text-ink-muted">{p.product?.category}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-ink">{p.seller?.shopName}</p>
                        <p className="text-xs text-ink-muted">{p.seller?.location}</p>
                      </td>
                      <td className="px-5 py-3 text-ink">NPR {p.currentPrice}</td>
                      <td className="px-5 py-3 text-ink-muted">NPR {p.averageMarketPrice ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${p.priceDeviation > 15 ? 'text-accent-dark' : p.priceDeviation < 0 ? 'text-local' : 'text-ink-muted'}`}>
                          {p.priceDeviation > 0 ? '+' : ''}
                          {p.priceDeviation}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[p.status]}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/government/market-monitoring/${p.priceId}`}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
