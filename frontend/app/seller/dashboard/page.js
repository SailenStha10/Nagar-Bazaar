'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet,
  ShoppingBag,
  Package,
  Star,
  AlertTriangle,
  Store,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trophy,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/utils/api';
import useAuth from '@/hooks/useAuth';
import DashboardStatCard from '@/components/DashboardStatCard';

const statusBadge = {
  placed: 'bg-accent-light text-accent-dark',
  confirmed: 'bg-primary/10 text-primary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-local-light text-local',
  cancelled: 'bg-surface-alt text-ink-muted',
};

const verificationBadge = {
  approved: { label: 'Verified Seller', style: 'bg-local-light text-local' },
  pending: { label: 'Verification Pending', style: 'bg-accent-light text-accent-dark' },
  review_required: { label: 'Review Required', style: 'bg-accent-light text-accent-dark' },
  rejected: { label: 'Verification Rejected', style: 'bg-surface-alt text-ink-muted' },
};

const CATEGORY_COLORS = ['#0f2c4c', '#c1712f', '#3e7c59', '#9c5320', '#1e4d7b', '#5c6577', '#e6d9c3'];

function SellerRegistrationForm({ onRegistered }) {
  const [form, setForm] = useState({ shopName: '', description: '', location: '', contact: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/sellers/register', form);
      onRegistered();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create seller profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-3xl border border-border bg-surface-raised p-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">One Last Step</span>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Set Up Your Store</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Create your seller profile to start listing products. It will need government verification before
          it appears publicly.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg bg-accent-light px-4 py-2.5 text-sm text-accent-dark">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-ink">Shop Name</label>
            <input
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Contact Number</label>
            <input
              name="contact"
              value={form.contact}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? 'Creating Profile...' : 'Create Store Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [error, setError] = useState('');
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const loadDashboard = () => {
    setLoading(true);
    setError('');
    setNeedsRegistration(false);
    api
      .get('/sellers/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setNeedsRegistration(true);
        } else {
          setError(err.response?.data?.message || 'Failed to load dashboard');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'seller') loadDashboard();
  }, [user]);

  // Category-wise product count for the donut below the main chart —
  // computed from the seller's own catalog, not fabricated.
  useEffect(() => {
    if (user?.role !== 'seller') return;
    api
      .get('/sellers/products', { params: { limit: 100 } })
      .then((res) => {
        const products = res.data.data || [];
        const counts = new Map();
        products.forEach((p) => {
          const name = p.categoryId?.name || 'Uncategorized';
          counts.set(name, (counts.get(name) || 0) + 1);
        });
        setCategoryBreakdown([...counts.entries()].map(([name, count]) => ({ name, count })));
      })
      .catch(() => setCategoryBreakdown([]));
  }, [user]);

  if (!user || user.role !== 'seller' || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface-raised" />
          ))}
        </div>
      </div>
    );
  }

  if (needsRegistration) {
    return <SellerRegistrationForm onRegistered={loadDashboard} />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-display text-xl font-semibold text-ink">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  const badge = verificationBadge[data.verificationStatus] || verificationBadge.pending;
  const ratingPercent = data.averageRating > 0 ? Math.round((data.averageRating / 5) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Welcome back, {user.name.split(' ')[0]}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-ink-muted">{data.shopName}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.style}`}>{badge.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/seller/products/new" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Add Product
          </Link>
          <Link href="/seller/orders" className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary">
            View Orders
          </Link>
        </div>
      </div>

      {/* Compact stat grid (left) + big sales chart (right), like the reference dashboard */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-2 gap-5">
          <DashboardStatCard title="Sales This Month" value={`NPR ${data.thisMonthSales.toLocaleString('en-NP')}`} icon={Wallet} color="primary" />
          <DashboardStatCard title="Orders This Month" value={data.thisMonthOrders} icon={ShoppingBag} color="accent" />
          <DashboardStatCard title="Total Products" value={data.totalProducts} icon={Package} color="local" />
          <DashboardStatCard title="Low Stock Alerts" value={data.lowStockCount} icon={AlertTriangle} color="accent" />
        </div>

        <div id="sales-chart" className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Sales — Last 30 Days</h2>
            {data.salesGrowthPercent !== null && (
              <span className={`flex items-center gap-1 text-sm font-semibold ${data.salesGrowthPercent >= 0 ? 'text-local' : 'text-accent-dark'}`}>
                {data.salesGrowthPercent >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {data.salesGrowthPercent >= 0 ? '+' : ''}
                {data.salesGrowthPercent}% vs last month
              </span>
            )}
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesLast30Days}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f2c4c" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0f2c4c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: '#5c6577' }}
                  axisLine={{ stroke: '#e6e0d2' }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(value) => [`NPR ${value.toLocaleString('en-NP')}`, 'Sales']}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0f2c4c" strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category breakdown donut + rating ring */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Category Wise Product Count</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Add products to see a category breakdown.</p>
          ) : (
            <div className="mt-4 flex items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="count" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {categoryBreakdown.map((entry, i) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {categoryBreakdown.map((entry, i) => (
                  <span key={entry.name} className="flex items-center gap-1.5 text-ink-muted">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    {entry.name} ({entry.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Average Rating</h2>
          <div className="mt-2 flex items-center gap-6">
            <div className="relative h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: ratingPercent }, { value: 100 - ratingPercent }]}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={64}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill="#c1712f" />
                    <Cell fill="#f4efe4" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-semibold text-ink">
                  {data.averageRating > 0 ? data.averageRating : '—'}
                </span>
                {data.averageRating > 0 && <Star size={13} className="fill-accent text-accent" />}
              </div>
            </div>
            <div>
              <p className="text-sm text-ink-muted">
                {data.averageRating > 0
                  ? `Your storefront rates ${ratingPercent}% of the maximum 5-star score.`
                  : 'No customer ratings yet — they will appear here once orders are reviewed.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales summary */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <p className="text-xs text-ink-muted">Today&apos;s Sales</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-ink">NPR {data.todaySales.toLocaleString('en-NP')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <p className="text-xs text-ink-muted">Last Month</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-ink">NPR {data.lastMonthSales.toLocaleString('en-NP')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <p className="text-xs text-ink-muted">Month-over-Month Growth</p>
          {data.salesGrowthPercent === null ? (
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink-muted">—</p>
          ) : (
            <p className={`mt-1.5 flex items-center gap-1.5 font-display text-2xl font-semibold ${data.salesGrowthPercent >= 0 ? 'text-local' : 'text-accent-dark'}`}>
              {data.salesGrowthPercent >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {data.salesGrowthPercent >= 0 ? '+' : ''}
              {data.salesGrowthPercent}%
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Recent Orders */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
              <Link href="/seller/orders" className="flex items-center gap-1 text-sm font-semibold text-primary">
                View All
                <ArrowRight size={14} />
              </Link>
            </div>

            {data.recentOrders.length === 0 ? (
              <p className="mt-6 text-sm text-ink-muted">No orders yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="py-2 pr-4">Order #</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4">Items</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentOrders.map((order) => (
                      <tr key={order.orderId}>
                        <td className="py-3 pr-4 font-medium text-ink">{order.orderNumber}</td>
                        <td className="py-3 pr-4 text-ink-muted">{order.customerName}</td>
                        <td className="py-3 pr-4 text-ink-muted">{order.itemsForThisSeller}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[order.orderStatus] || statusBadge.placed}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-ink-muted">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-primary">
                          NPR {order.totalAmount.toLocaleString('en-NP')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders by status */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Orders by Status</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                  <Bar dataKey="count" fill="#c1712f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top products */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <Trophy size={17} className="text-accent-dark" />
              <h2 className="font-display text-lg font-semibold text-ink">Top Products</h2>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">No sales yet.</p>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {data.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt text-xs font-semibold text-ink-muted">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-muted">
                          {p.salesCount} sold {p.rating > 0 ? `· ${p.rating} ★` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">NPR {p.revenue.toLocaleString('en-NP')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Low stock alert */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-accent-dark" />
              <h2 className="font-display text-base font-semibold text-ink">Low Stock Alert</h2>
            </div>
            {data.lowStockProducts.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">All products are well stocked.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {data.lowStockProducts.map((p) => (
                  <li key={p._id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-ink">{p.name}</span>
                      {p.categoryId?.name && <span className="ml-1.5 text-xs text-ink-muted">({p.categoryId.name})</span>}
                    </div>
                    <span className="font-semibold text-accent-dark">{p.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/seller/products"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Manage Inventory
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Account status */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-primary" />
              <h2 className="font-display text-base font-semibold text-ink">Account Status</h2>
            </div>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.style}`}>{badge.label}</span>

            {data.verificationStatus === 'rejected' && data.rejectionReason && (
              <p className="mt-3 text-sm text-ink-muted">Reason: {data.rejectionReason}</p>
            )}
            {data.verificationStatus === 'review_required' && data.reviewReason && (
              <p className="mt-3 text-sm text-ink-muted">Needs: {data.reviewReason}</p>
            )}

            {data.verificationHistory?.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {data.verificationHistory
                  .slice()
                  .reverse()
                  .slice(0, 4)
                  .map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Clock size={13} className="mt-0.5 shrink-0 text-ink-muted" />
                      <div>
                        <p className="text-xs font-semibold capitalize text-ink">{h.status.replace('_', ' ')}</p>
                        <p className="text-xs text-ink-muted">
                          {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {h.officerName ? ` · ${h.officerName}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
