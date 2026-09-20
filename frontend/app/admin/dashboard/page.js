'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Users,
  Store,
  ShieldCheck,
  Package,
  ShoppingBag,
  Wallet,
  MessageSquareWarning,
  TrendingUp,
  PackageX,
  Activity,
  User,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import DashboardStatCard from '@/components/DashboardStatCard';

const AdminChartsSection = dynamic(() => import('./AdminChartsSection'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-surface-raised" />
      ))}
    </div>
  ),
});

const roleBadge = {
  customer: 'bg-primary/10 text-primary',
  seller: 'bg-accent-light text-accent-dark',
  officer: 'bg-local-light text-local',
  admin: 'bg-surface-alt text-ink-muted',
};

const activityIcon = {
  user: User,
  seller: Store,
  complaint: MessageSquareWarning,
  order: ShoppingBag,
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignSelections, setAssignSelections] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  const loadDashboard = () => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadDashboard();
  }, [user]);

  const handleAssign = async (complaintId) => {
    const officerId = assignSelections[complaintId];
    if (!officerId) return;
    setAssignError('');
    setAssigningId(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/assign`, { officerId });
      loadDashboard();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setAssigningId(null);
    }
  };

  if (!user || user.role !== 'admin' || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  const {
    systemStats,
    userManagement,
    sellerManagement,
    marketActivity,
    complaintAnalytics,
    systemHealth,
    officerPerformance,
    recentActivity,
    unassignedComplaints,
  } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Welcome, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-ink-muted">Platform-wide statistics, activity, and management.</p>

      {/* System stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard title="Total Users" value={systemStats.totalUsers} icon={Users} color="primary" />
        <DashboardStatCard title="Total Sellers" value={systemStats.totalSellers} icon={Store} color="accent" />
        <DashboardStatCard title="Verified Sellers" value={systemStats.verifiedSellers} icon={ShieldCheck} color="local" />
        <DashboardStatCard title="Total Products" value={systemStats.totalProducts} icon={Package} color="primary" />
        <DashboardStatCard title="Orders This Month" value={systemStats.totalOrdersThisMonth} icon={ShoppingBag} color="accent" />
        <DashboardStatCard title="Revenue This Month" value={`NPR ${systemStats.totalRevenueThisMonth.toLocaleString('en-NP')}`} icon={Wallet} color="local" />
        <DashboardStatCard title="Total Complaints" value={systemStats.totalComplaints} icon={MessageSquareWarning} color="accent" />
        <DashboardStatCard title="Resolution Rate" value={`${systemStats.resolutionRate}%`} icon={TrendingUp} color="primary" />
      </div>

      {/* Complaint assignment — central control point for routing complaints to officers */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={17} className="text-primary" />
            <h2 className="font-display text-base font-semibold text-ink">Assign Complaints to Officers</h2>
          </div>
          <Link href="/admin/complaints" className="text-sm font-semibold text-primary">View All Complaints</Link>
        </div>

        {assignError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
            <AlertCircle size={16} />
            {assignError}
          </div>
        )}

        {unassignedComplaints.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No unassigned complaints right now — everything is being handled.</p>
        ) : officerPerformance.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            {unassignedComplaints.length} unassigned complaint(s), but no officers exist yet.{' '}
            <Link href="/admin/officers" className="font-semibold text-primary hover:underline">Create an officer</Link> to assign them.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="py-2 pr-4">Complaint</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Assign To</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unassignedComplaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{c.title}</p>
                      <p className="text-xs text-ink-muted">{c.complaintNumber}</p>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted capitalize">{c.category.replace('_', ' ')}</td>
                    <td className="py-3 pr-4 text-ink-muted capitalize">{c.priority}</td>
                    <td className="py-3 pr-4 text-ink-muted">{formatDate(c.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={assignSelections[c.complaintId] || ''}
                        onChange={(e) => setAssignSelections((prev) => ({ ...prev, [c.complaintId]: e.target.value }))}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="">Select officer...</option>
                        {officerPerformance.map((o) => (
                          <option key={o.officerId} value={o.officerId}>
                            {o.name} ({o.assigned} active)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <button
                        type="button"
                        disabled={!assignSelections[c.complaintId] || assigningId === c.complaintId}
                        onClick={() => handleAssign(c.complaintId)}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-40"
                      >
                        {assigningId === c.complaintId ? 'Assigning...' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User management */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent User Registrations</h2>
            <Link href="/admin/users" className="text-sm font-semibold text-primary">View All</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userManagement.recentUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="py-3 pr-4 font-medium text-ink">{u.name}</td>
                    <td className="py-3 pr-4 text-ink-muted">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadge[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">User Breakdown</h2>
          <div className="mt-4 space-y-2.5">
            {userManagement.userBreakdown.map((u) => (
              <div key={u.role} className="flex items-center justify-between text-sm">
                <span className="capitalize text-ink-muted">{u.role}s</span>
                <span className="font-semibold text-ink">{u.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs text-ink-muted">New Today</p>
            <p className="font-display text-2xl font-semibold text-ink">{userManagement.newUsersToday}</p>
          </div>
        </div>
      </div>

      <AdminChartsSection sellerManagement={sellerManagement} marketActivity={marketActivity} complaintAnalytics={complaintAnalytics} />

      {/* System health + officer performance */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">System Health</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-1.5 text-ink-muted">
                <Package size={14} />
                <span className="text-xs">Available Products</span>
              </div>
              <p className="mt-1.5 font-display text-xl font-semibold text-ink">{systemHealth.totalProductsAvailable}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-1.5 text-accent-dark">
                <PackageX size={14} />
                <span className="text-xs">Out of Stock</span>
              </div>
              <p className="mt-1.5 font-display text-xl font-semibold text-ink">{systemHealth.outOfStockProducts}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Categories</p>
            <div className="mt-2 space-y-1.5">
              {systemHealth.categoriesOverview.map((c) => (
                <div key={c.categoryId} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{c.icon} {c.name}</span>
                  <span className="text-ink-muted">{c.productCount} products</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Officer Performance</h2>
          {officerPerformance.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No officers registered yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="py-2 pr-4">Officer</th>
                    <th className="py-2 pr-4">Assigned</th>
                    <th className="py-2 pr-4">Resolved</th>
                    <th className="py-2 pr-4">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {officerPerformance.map((o) => (
                    <tr key={o.officerId}>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-ink">{o.name}</p>
                        <p className="text-xs text-ink-muted">{o.department}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-muted">{o.assigned}</td>
                      <td className="py-2.5 pr-4 text-ink-muted">{o.resolved}</td>
                      <td className="py-2.5 pr-4 font-semibold text-ink">{o.resolutionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <div className="flex items-center gap-2">
          <Activity size={17} className="text-primary" />
          <h2 className="font-display text-base font-semibold text-ink">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No recent activity yet.</p>
        ) : (
          <ol className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {recentActivity.map((a, i) => {
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
  );
}
