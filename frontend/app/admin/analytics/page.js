'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const sumRange = (arr, days) => arr.slice(-days).reduce((sum, d) => sum + (d.count ?? d.revenue ?? 0), 0);

const toCsv = (rows, headers) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(',')));
  return lines.join('\n');
};

const downloadCsv = (filename, csv) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'admin' || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-border bg-surface-raised" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-display text-xl font-semibold text-ink">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  const { marketActivity, complaintAnalytics, sellerManagement } = data;

  const combinedTrend = marketActivity.ordersTrend.map((o, i) => ({
    date: o.date,
    orders: o.count,
    revenue: marketActivity.revenueTrend[i]?.revenue || 0,
  }));

  const last7Orders = sumRange(marketActivity.ordersTrend, 7);
  const prev7Orders = sumRange(marketActivity.ordersTrend.slice(0, -7), 7);
  const ordersChange = prev7Orders > 0 ? Math.round(((last7Orders - prev7Orders) / prev7Orders) * 1000) / 10 : null;

  const last7Revenue = sumRange(marketActivity.revenueTrend, 7);
  const prev7Revenue = sumRange(marketActivity.revenueTrend.slice(0, -7), 7);
  const revenueChange = prev7Revenue > 0 ? Math.round(((last7Revenue - prev7Revenue) / prev7Revenue) * 1000) / 10 : null;

  const handleExport = () => {
    const rows = marketActivity.salesByCategory.map((c) => ({
      category: c.category,
      salesRevenue: c.amount,
    }));
    const csv = toCsv(rows, ['category', 'salesRevenue']);
    downloadCsv(`sales-by-category-${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Analytics</h1>
          <p className="mt-1 text-sm text-ink-muted">Comparative trends over the last 14 days.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
        >
          <Download size={15} />
          Export Sales CSV
        </button>
      </div>

      {/* Comparison view: this week vs previous week */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <p className="text-xs text-ink-muted">Orders — Last 7 Days</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-ink">{last7Orders}</p>
          {ordersChange !== null && (
            <p className={`mt-1 text-xs font-semibold ${ordersChange >= 0 ? 'text-local' : 'text-accent-dark'}`}>
              {ordersChange >= 0 ? '+' : ''}
              {ordersChange}% vs. previous 7 days
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <p className="text-xs text-ink-muted">Revenue — Last 7 Days</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-ink">NPR {last7Revenue.toLocaleString('en-NP')}</p>
          {revenueChange !== null && (
            <p className={`mt-1 text-xs font-semibold ${revenueChange >= 0 ? 'text-local' : 'text-accent-dark'}`}>
              {revenueChange >= 0 ? '+' : ''}
              {revenueChange}% vs. previous 7 days
            </p>
          )}
        </div>
      </div>

      {/* Orders + revenue combined */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <h2 className="font-display text-base font-semibold text-ink">Orders &amp; Revenue (14 Days)</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} interval={1} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#0f2c4c" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (NPR)" stroke="#c1712f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category performance table */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Sales by Category</h2>
          <div className="mt-4 divide-y divide-border">
            {marketActivity.salesByCategory.length === 0 ? (
              <p className="text-sm text-ink-muted">No sales data yet.</p>
            ) : (
              marketActivity.salesByCategory
                .slice()
                .sort((a, b) => b.amount - a.amount)
                .map((c) => (
                  <div key={c.category} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink">{c.category}</span>
                    <span className="font-semibold text-ink">NPR {c.amount.toLocaleString('en-NP')}</span>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Complaint Resolution (14 Days)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintAnalytics.resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Bar dataKey="count" fill="#3e7c59" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={17} className="text-primary" />
          <h2 className="font-display text-base font-semibold text-ink">Seller Verification Funnel</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sellerManagement.sellersByStatus.map((s) => (
            <div key={s.status} className="rounded-xl border border-border p-4 text-center">
              <p className="font-display text-2xl font-semibold text-ink">{s.count}</p>
              <p className="text-xs text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
