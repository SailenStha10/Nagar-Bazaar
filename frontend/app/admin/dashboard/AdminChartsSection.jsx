'use client';

import Link from 'next/link';
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

const CATEGORY_COLORS = ['#0f2c4c', '#c1712f', '#3e7c59', '#9c5320', '#1e4d7b', '#5c6577'];

export default function AdminChartsSection({ sellerManagement, marketActivity, complaintAnalytics }) {
  return (
    <>
      {/* Seller management */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Sellers by Status</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sellerManagement.sellersByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Bar dataKey="count" fill="#0f2c4c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-ink-muted">{sellerManagement.pendingVerifications} pending verification</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent Applications</h2>
            <Link href="/admin/sellers" className="text-sm font-semibold text-primary">Review</Link>
          </div>
          {sellerManagement.recentApplications.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No seller applications yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {sellerManagement.recentApplications.map((s) => (
                <div key={s.sellerId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.shopName}</p>
                    <p className="text-xs text-ink-muted">{s.location} &middot; {new Date(s.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      {
                        pending: 'bg-accent-light text-accent-dark',
                        approved: 'bg-local-light text-local',
                        rejected: 'bg-red-100 text-red-700',
                        review_required: 'bg-primary/10 text-primary',
                      }[s.status]
                    }`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Market activity */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Orders Trend (14 Days)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketActivity.ordersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Line type="monotone" dataKey="count" stroke="#0f2c4c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Revenue Trend (14 Days)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketActivity.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `NPR ${v.toLocaleString('en-NP')}`} labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Line type="monotone" dataKey="revenue" stroke="#c1712f" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6">
        <h2 className="font-display text-base font-semibold text-ink">Sales by Category</h2>
        <div className="mt-4 h-64">
          {marketActivity.salesByCategory.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted">No sales data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={marketActivity.salesByCategory} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {marketActivity.salesByCategory.map((entry, i) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `NPR ${v.toLocaleString('en-NP')}`} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Complaint analytics */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Complaints by Category</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={complaintAnalytics.categoryDistribution} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {complaintAnalytics.categoryDistribution.map((entry, i) => (
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
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintAnalytics.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Bar dataKey="count" fill="#3e7c59" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Top Complaint Categories</h2>
          <div className="mt-4 divide-y divide-border">
            {complaintAnalytics.topComplaintCategories.map((c) => (
              <div key={c.category} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink">{c.label}</span>
                <span className="font-semibold text-ink">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Resolution Trend (14 Days)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintAnalytics.resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11, fill: '#5c6577' }} axisLine={{ stroke: '#e6e0d2' }} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 12, fill: '#5c6577' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} contentStyle={{ borderRadius: 12, border: '1px solid #e6e0d2', fontSize: 13 }} />
                <Line type="monotone" dataKey="count" stroke="#9c5320" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
