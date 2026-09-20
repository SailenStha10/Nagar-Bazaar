'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  PackageSearch,
  DollarSign,
  Clock3,
  AlertTriangle,
  MessageSquareWarning,
  Store,
  HelpCircle,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const categoryMeta = {
  overpricing: { label: 'Overpricing', icon: DollarSign },
  expired_product: { label: 'Expired Product', icon: Clock3 },
  quality_issue: { label: 'Quality Issue', icon: AlertTriangle },
  misleading_info: { label: 'Misleading Info', icon: MessageSquareWarning },
  seller_issue: { label: 'Seller Issue', icon: Store },
  other: { label: 'Other', icon: HelpCircle },
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const assignedOptions = [
  { value: '', label: 'All Complaints' },
  { value: 'me', label: 'Assigned to Me' },
  { value: 'unassigned', label: 'Unassigned' },
];

const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'priority-desc', label: 'Priority: High First' },
];

const statusBadge = {
  submitted: 'bg-accent-light text-accent-dark',
  under_review: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-local-light text-local',
};

const priorityBadge = {
  high: 'bg-accent-dark text-white',
  medium: 'bg-accent-light text-accent-dark',
  low: 'bg-surface-alt text-ink-muted',
};

const daysOpen = (createdAt) => Math.max(0, Math.floor((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24)));

export default function GovernmentComplaintsPage() {
  return (
    <Suspense fallback={null}>
      <ComplaintsQueue />
    </Suspense>
  );
}

function ComplaintsQueue() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [assignedTo, setAssignedTo] = useState(searchParams.get('assignedTo') || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    setLoading(true);
    setError('');
    const [sortBy, sortOrder] = sort.split('-');
    const params = { page, limit: 10, sortBy, sortOrder };
    if (status) params.status = status;
    if (category) params.category = category;
    if (assignedTo) params.assignedTo = assignedTo;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (debouncedSearch) params.q = debouncedSearch;

    api
      .get('/complaints', { params })
      .then((res) => {
        setComplaints(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load complaints'))
      .finally(() => setLoading(false));
  }, [user, page, status, category, assignedTo, dateFrom, dateTo, sort, debouncedSearch]);

  if (!user || !['officer', 'admin'].includes(user.role)) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Complaints Queue</h1>

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
            placeholder="Search by title or complaint number..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
            value={assignedTo}
            onChange={(e) => {
              setPage(1);
              setAssignedTo(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {assignedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <span className="text-sm text-ink-muted">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <PackageSearch size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No complaints found</p>
            <p className="mt-1 text-sm text-ink-muted">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Complaint</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Submitted By</th>
                    <th className="px-5 py-3">Assigned To</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Days Open</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complaints.map((c) => {
                    const meta = categoryMeta[c.category] || categoryMeta.other;
                    return (
                      <tr key={c.complaintId}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${
                                c.priority === 'high' ? 'bg-accent-dark' : c.priority === 'medium' ? 'bg-accent' : 'bg-border'
                              }`}
                              title={`${c.priority} priority`}
                            />
                            <div>
                              <p className="font-medium text-ink">{c.title}</p>
                              <p className="text-xs text-ink-muted">{c.complaintNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-ink-muted">
                            <meta.icon size={13} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-ink-muted">{c.submittedBy?.name || '—'}</td>
                        <td className="px-5 py-3 text-ink-muted">
                          {c.assignedOfficer?.name || <span className="text-accent-dark">Unassigned</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[c.status]}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-ink-muted">{daysOpen(c.createdAt)}d</td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/government/complaints/${c.complaintId}`}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
