'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Timer,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  AlertTriangle,
  Activity,
  MessageSquareWarning,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import DashboardStatCard from '@/components/DashboardStatCard';

const CATEGORY_COLORS = ['#0f2c4c', '#c1712f', '#3e7c59', '#9c5320', '#1e4d7b', '#5c6577'];

const statusBadge = {
  submitted: 'bg-accent-light text-accent-dark',
  under_review: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-local-light text-local',
};

const priorityDot = {
  high: 'bg-accent-dark',
  medium: 'bg-accent',
  low: 'bg-border',
};

const sellerStatusBadge = {
  pending: 'bg-accent-light text-accent-dark',
  approved: 'bg-local-light text-local',
  rejected: 'bg-red-100 text-red-700',
  review_required: 'bg-primary/10 text-primary',
};

const activityIcon = {
  complaint: MessageSquareWarning,
  verification: ShieldCheck,
  price: TrendingUp,
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function GovernmentDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'officer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'officer') return;
    api
      .get('/officers/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'officer' || loading) {
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

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-display text-xl font-semibold text-ink">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Welcome header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Welcome, {data.officerProfile.name?.split(' ')[0] || 'Officer'}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data.officerProfile.department || 'Government Office'}
            {data.officerProfile.designation ? ` · ${data.officerProfile.designation}` : ''}
            {now ? ` · ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
          </p>
        </div>
      </div>

      {/* System-wide stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardStatCard title="Assigned to Me" value={data.assignedComplaints} icon={FileText} color="primary" />
        <DashboardStatCard title="Pending" value={data.pendingComplaints} icon={Clock} color="accent" />
        <DashboardStatCard title="Resolved This Month" value={data.resolvedThisMonth} icon={CheckCircle2} color="local" />
        <DashboardStatCard title="Avg. Resolution Time" value={`${data.averageResolutionTime}d`} icon={Timer} color="accent" />
        <DashboardStatCard title="Sellers Under Review" value={data.sellersUnderReview} icon={ShieldQuestion} color="accent" />
        <DashboardStatCard title="Verified Sellers" value={data.verifiedSellers} icon={ShieldCheck} color="local" />
      </div>

      {/* My workload table */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <div className="flex items-center gap-2">
          <UserCheck size={17} className="text-primary" />
          <h2 className="font-display text-base font-semibold text-ink">My Workload</h2>
        </div>
        {data.myWorkload.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No pending complaints assigned to you.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="py-2 pr-4">Complaint</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Assigned</th>
                  <th className="py-2 pr-4">Days Pending</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.myWorkload.map((c) => (
                  <tr key={c.complaintId}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{c.title}</p>
                      <p className="text-xs text-ink-muted">{c.complaintNumber}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 text-ink-muted capitalize">
                        <span className={`h-2 w-2 rounded-full ${priorityDot[c.priority]}`} />
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{formatDate(c.assignedDate)}</td>
                    <td className="py-3 pr-4 text-ink-muted">{c.daysPending}d</td>
                    <td className="py-3 pr-4 text-right">
                      <Link href={`/government/complaints/${c.complaintId}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Complaints by Category</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categoryDistribution} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {data.categoryDistribution.map((entry, i) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Complaints by Status</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Bar dataKey="count" fill="#0f2c4c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2: resolution timeline + workload trend */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Resolution Timeline (14 Days)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.resolutionTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: '#5c6577' }}
                  axisLine={{ stroke: '#e6e0d2' }}
                  tickLine={false}
                  interval={1}
                />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
                />
                <Line type="monotone" dataKey="count" stroke="#3e7c59" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">My Workload Trend (14 Days)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.workloadTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: '#5c6577' }}
                  axisLine={{ stroke: '#e6e0d2' }}
                  tickLine={false}
                  interval={1}
                />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
                />
                <Line type="monotone" dataKey="count" stroke="#c1712f" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Complaints submitted trend */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <h2 className="font-display text-base font-semibold text-ink">Complaints Submitted — Last 14 Days</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 11, fill: '#5c6577' }}
                axisLine={{ stroke: '#e6e0d2' }}
                tickLine={false}
                interval={1}
              />
              <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="count" stroke="#9c5320" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seller verification + market monitoring */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={17} className="text-primary" />
              <h2 className="font-display text-base font-semibold text-ink">Seller Verification</h2>
            </div>
            <Link href="/government/sellers" className="flex items-center gap-1 text-sm font-semibold text-primary">
              Review
              <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentSellerApplications.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No seller applications yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {data.recentSellerApplications.map((s) => (
                <Link key={s.sellerId} href={`/government/sellers/${s.sellerId}`} className="flex items-center justify-between py-3 hover:text-primary">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.shopName}</p>
                    <p className="text-xs text-ink-muted">{s.location} &middot; {formatDate(s.appliedDate)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${sellerStatusBadge[s.status]}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-accent-dark" />
              <h2 className="font-display text-base font-semibold text-ink">Market Monitoring</h2>
            </div>
            <Link href="/government/market-monitoring" className="flex items-center gap-1 text-sm font-semibold text-primary">
              Review
              <ArrowRight size={14} />
            </Link>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            <span className="font-display text-2xl font-semibold text-ink">{data.marketMonitoring.pricesUnderReview}</span> prices flagged for review
          </p>
          {data.marketMonitoring.topOverpriced.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Most Overpriced</p>
              <div className="mt-2 space-y-1.5">
                {data.marketMonitoring.topOverpriced.slice(0, 3).map((p) => (
                  <div key={p.priceId} className="flex items-center justify-between text-sm">
                    <span className="truncate text-ink">{p.product}</span>
                    <span className="font-semibold text-accent-dark">+{p.deviation}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.marketMonitoring.recentPriceViolations.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Recent Violations</p>
              <div className="mt-2 divide-y divide-border">
                {data.marketMonitoring.recentPriceViolations.slice(0, 3).map((p) => (
                  <Link
                    key={p.priceId}
                    href={`/government/market-monitoring/${p.priceId}`}
                    className="flex items-center justify-between py-2 text-sm hover:text-primary"
                  >
                    <span className="truncate text-ink">{p.product} &middot; {p.seller}</span>
                    <span className="text-xs text-ink-muted">{formatDate(p.lastUpdated)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent complaints (system-wide) + Quick actions */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent Complaints (System-wide)</h2>
            <Link href="/government/complaints" className="flex items-center gap-1 text-sm font-semibold text-primary">
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          {data.unassignedRecentComplaints.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No other complaints right now.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {data.unassignedRecentComplaints.map((c) => (
                <Link key={c.complaintId} href={`/government/complaints/${c.complaintId}`} className="flex items-center justify-between py-3 hover:text-primary">
                  <div>
                    <p className="text-sm font-medium text-ink">{c.title}</p>
                    <p className="text-xs text-ink-muted">
                      {c.submittedBy || 'Citizen'} &middot; {formatDate(c.createdAt)}
                      {!c.assigned && <span className="ml-1.5 text-accent-dark">&middot; Unassigned</span>}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-primary" />
            <h2 className="font-display text-base font-semibold text-ink">My Recent Activity</h2>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No recent activity yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {data.recentActivity.map((a, i) => {
                const Icon = activityIcon[a.type] || Activity;
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                    <div>
                      <p className="text-sm text-ink">{a.description}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
