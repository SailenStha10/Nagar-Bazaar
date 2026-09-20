'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  MessageSquareWarning,
  ShoppingBag,
  ShoppingCart,
  Heart,
  ArrowRight,
  Megaphone,
  Gift,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import useWishlist from '@/hooks/useWishlist';
import api from '@/utils/api';

const CATEGORY_COLORS = ['#0f2c4c', '#c1712f', '#3e7c59', '#9c5320', '#1e4d7b', '#5c6577'];

const orderStatusBadge = {
  placed: 'bg-accent-light text-accent-dark',
  confirmed: 'bg-primary/10 text-primary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-local-light text-local',
  cancelled: 'bg-surface-alt text-ink-muted',
};

const complaintStatusBadge = {
  submitted: 'bg-accent-light text-accent-dark',
  under_review: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-local-light text-local',
};

const noticePriorityBadge = {
  high: 'bg-accent-dark text-white',
  medium: 'bg-accent-light text-accent-dark',
  low: 'bg-surface-alt text-ink-muted',
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Tinted "at a glance" cards, each with a quick link — mirrors the reference
// dashboard's colored summary cards while staying within the existing palette.
function GlanceCard({ tone, value, label, href, linkLabel, icon: Icon }) {
  return (
    <div className={`rounded-2xl p-5 ${tone.bg}`}>
      <p className={`font-display text-3xl font-semibold ${tone.text}`}>{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
      <Link
        href={href}
        className={`mt-4 flex items-center justify-between text-sm font-semibold ${tone.text} transition-all duration-200 hover:gap-2`}
      >
        <span className="flex items-center gap-1">
          {linkLabel}
          <ArrowRight size={14} />
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/70 ${tone.text}`}>
          <Icon size={15} />
        </span>
      </Link>
    </div>
  );
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    api
      .get('/customers/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'customer' || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-surface-raised" />
          ))}
        </div>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">My Account</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Welcome back, {user.name.split(' ')[0]}</h1>
          {now && (
            <p className="mt-1 text-sm text-ink-muted">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/products" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Browse Products
          </Link>
          <Link href="/customer/cart" className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary">
            View Cart
          </Link>
        </div>
      </div>

      {/* At-a-glance tinted cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <GlanceCard
          tone={{ bg: 'bg-accent-light', text: 'text-accent-dark' }}
          value={cart.totalItems}
          label="Products in your cart"
          href="/customer/cart"
          linkLabel="View My Cart"
          icon={ShoppingCart}
        />
        <GlanceCard
          tone={{ bg: 'bg-primary/10', text: 'text-primary' }}
          value={wishlistItems.length}
          label="Products in your wishlist"
          href="/customer/wishlist"
          linkLabel="View All Wishlist"
          icon={Heart}
        />
        <GlanceCard
          tone={{ bg: 'bg-local-light', text: 'text-local' }}
          value={data.totalOrders}
          label="Products in your orders"
          href="/customer/orders"
          linkLabel="View All Orders"
          icon={Package}
        />
        <GlanceCard
          tone={{ bg: 'bg-accent-light', text: 'text-accent-dark' }}
          value={data.complaintCount}
          label="Complaints filed"
          href="/customer/complaints"
          linkLabel="View All Complaints"
          icon={MessageSquareWarning}
        />
      </div>

      {/* Spending donut + My Orders list, side by side like the reference */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Spending by Category</h2>
          <div className="mt-4 h-56">
            {data.spendingChart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-muted">No spending data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.spendingChart} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {data.spendingChart.map((entry, i) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `NPR ${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            <div>
              <p className="font-display text-lg font-semibold text-ink">{data.totalOrders}</p>
              <p className="text-[11px] text-ink-muted">Orders</p>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{data.completedOrders}</p>
              <p className="text-[11px] text-ink-muted">Completed</p>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink">NPR {data.totalSpent.toLocaleString()}</p>
              <p className="text-[11px] text-ink-muted">Spent</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">My Orders</h2>
            <Link href="/customer/orders" className="flex items-center gap-1 text-sm font-semibold text-primary">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="mt-6 flex flex-col items-center py-8 text-center">
              <ShoppingBag size={28} className="text-ink-muted" />
              <p className="mt-3 text-sm text-ink-muted">No orders yet.</p>
              <Link href="/products" className="mt-3 text-sm font-semibold text-primary hover:underline">
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {data.recentOrders.map((o) => (
                <div key={o.orderId} className="flex items-center gap-4 py-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-accent-light text-primary/60">
                    <ShoppingBag size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{o.orderNumber}</p>
                    <p className="text-xs text-ink-muted">
                      {formatDate(o.createdAt)} &middot; NPR {o.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize sm:inline ${orderStatusBadge[o.orderStatus]}`}>
                    {o.orderStatus}
                  </span>
                  <Link
                    href={`/customer/orders/${o.orderId}`}
                    className="shrink-0 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-ink transition-all duration-200 hover:border-primary hover:text-primary"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Promo-style CTAs */}
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-accent-light p-6">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-accent-dark">
              <Gift size={20} />
            </span>
            <p className="mt-3 font-display text-lg font-semibold text-ink">Have a problem with an order?</p>
            <p className="mt-1 text-sm text-ink-muted">File a complaint and an officer will review it.</p>
            <Link
              href="/customer/complaints/new"
              className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              File a Complaint
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-local-light p-6">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-local">
              <Megaphone size={20} />
            </span>
            <p className="mt-3 font-display text-lg font-semibold text-ink">Stay in the loop</p>
            <p className="mt-1 text-sm text-ink-muted">Read the latest government notices and price advisories.</p>
            <Link
              href="/notices"
              className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              View Notices
            </Link>
          </div>
        </div>
      </div>

      {/* Orders trend + Active orders */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Orders — Last 30 Days</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.orderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: '#5c6577' }}
                  axisLine={{ stroke: '#e6e0d2' }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
                />
                <Line type="monotone" dataKey="count" stroke="#0f2c4c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Active Orders</h2>
          {data.activeOrdersList.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No orders in progress right now.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {data.activeOrdersList.map((o) => (
                <Link
                  key={o.orderId}
                  href={`/customer/orders/${o.orderId}`}
                  className="flex items-center justify-between py-3 hover:text-primary"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{o.orderNumber}</p>
                    <p className="text-xs text-ink-muted">Placed {formatDate(o.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${orderStatusBadge[o.orderStatus]}`}>
                    {o.orderStatus}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complaints + Notices */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Complaints</h2>
            <Link href="/customer/complaints" className="flex items-center gap-1 text-sm font-semibold text-primary">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentComplaints.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No complaints filed.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {data.recentComplaints.map((c) => (
                <Link
                  key={c.complaintId}
                  href={`/customer/complaints/${c.complaintId}`}
                  className="flex items-center justify-between py-3 hover:text-primary"
                >
                  <p className="truncate pr-3 text-sm text-ink">{c.title}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${complaintStatusBadge[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Government Notices</h2>
            <Link href="/notices" className="flex items-center gap-1 text-sm font-semibold text-primary">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentNotices.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No notices published yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {data.recentNotices.map((n) => (
                <Link key={n._id} href={`/notices/${n._id}`} className="block py-3 hover:text-primary">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${noticePriorityBadge[n.priority]}`}>
                      {n.priority}
                    </span>
                    <span className="text-xs text-ink-muted capitalize">{n.category.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">{n.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
