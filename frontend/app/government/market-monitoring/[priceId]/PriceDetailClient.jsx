'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Store, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const statusBadge = {
  normal: 'bg-local-light text-local',
  review_required: 'bg-accent-dark text-white',
};

export default function PriceDetailClient({ priceId }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [status, setStatus] = useState('normal');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const loadPrice = () => {
    setLoading(true);
    setError('');
    api
      .get(`/market-monitoring/prices/${priceId}`)
      .then((res) => {
        setPrice(res.data.data);
        setStatus(res.data.data.status);
        setRemarks(res.data.data.remarks || '');
      })
      .catch(() => setError('Price record not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    loadPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceId, user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/market-monitoring/prices/${priceId}/status`, { status, remarks: remarks.trim() || undefined });
      loadPrice();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update price status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || !['officer', 'admin'].includes(user.role) || loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-10">
        <div className="h-8 w-48 rounded bg-surface-alt" />
        <div className="mt-6 h-96 rounded-2xl bg-surface-alt" />
      </div>
    );
  }

  if (error || !price) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Price record not found'}</p>
        <Link href="/government/market-monitoring" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Back to Monitoring
        </Link>
      </div>
    );
  }

  const chartData = (price.history || []).map((h) => ({
    date: h.date,
    price: h.price,
    average: h.averageMarketPrice,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/government/market-monitoring" className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-primary">
        <ArrowLeft size={15} />
        Back to Monitoring
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[price.status]}`}>
              {price.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-ink-muted">Last updated {new Date(price.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{price.product?.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{price.product?.category}</p>
        </div>
      </div>

      {actionError && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <p className="text-xs text-ink-muted">Current Price</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">NPR {price.currentPrice}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <p className="text-xs text-ink-muted">Avg. Market Price</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">NPR {price.averageMarketPrice ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <p className="text-xs text-ink-muted">Deviation</p>
              <p className={`mt-1 font-display text-xl font-semibold ${price.priceDeviation > 15 ? 'text-accent-dark' : 'text-ink'}`}>
                {price.priceDeviation > 0 ? '+' : ''}
                {price.priceDeviation}%
              </p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                <h2 className="font-display text-base font-semibold text-ink">Price History</h2>
              </div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tick={{ fontSize: 11, fill: '#5c6577' }}
                      axisLine={{ stroke: '#e6e0d2' }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#0f2c4c" strokeWidth={2} dot={false} name="Price" />
                    <Line type="monotone" dataKey="average" stroke="#c1712f" strokeWidth={2} dot={false} name="Market Avg." />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {price.otherSellers?.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <h2 className="font-display text-base font-semibold text-ink">Comparison with Other Sellers</h2>
              <div className="mt-4 divide-y divide-border">
                {price.otherSellers.map((o, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="text-ink">{o.seller?.shopName}</p>
                      <p className="text-xs text-ink-muted">{o.seller?.location}</p>
                    </div>
                    <span className="font-semibold text-ink">NPR {o.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-primary" />
              <h2 className="font-display text-sm font-semibold text-ink">Seller</h2>
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{price.seller?.shopName}</p>
            <p className="text-xs text-ink-muted">{price.seller?.location}</p>
          </div>

          <form onSubmit={handleUpdate} className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-sm font-semibold text-ink">Update Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-3 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="normal">Normal</option>
              <option value="review_required">Review Required</option>
            </select>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Officer remarks (optional)..."
              className="mt-3 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            {price.remarks && !remarks && <p className="mt-1 text-xs text-ink-muted">Previous remarks: {price.remarks}</p>}
            <button
              type="submit"
              disabled={actionLoading}
              className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
