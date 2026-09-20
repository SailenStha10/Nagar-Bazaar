'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, PackageSearch } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'overpricing', label: 'Overpricing' },
  { value: 'expired_product', label: 'Expired Product' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'misleading_info', label: 'Misleading Info' },
  { value: 'seller_issue', label: 'Seller Issue' },
  { value: 'other', label: 'Other' },
];

const sortOptions = [
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'status', label: 'By Status' },
];

const statusBadge = {
  submitted: 'bg-accent-light text-accent-dark',
  under_review: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-local-light text-local',
};

const statusLabel = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function CustomerComplaintsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    setLoading(true);
    setError('');
    const params = { page, limit: 10, sortBy };
    if (status) params.status = status;
    if (category) params.category = category;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (debouncedSearch) params.q = debouncedSearch;

    api
      .get('/complaints/citizen', { params })
      .then((res) => {
        setComplaints(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load complaints'))
      .finally(() => setLoading(false));
  }, [user, page, status, category, dateFrom, dateTo, sortBy, debouncedSearch]);

  if (!user || user.role !== 'customer') return null;

  const hasActiveFilters = status || category || dateFrom || dateTo || searchInput;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Services</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">My Complaints</h1>
        </div>
        <Link
          href="/customer/complaints/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={16} />
          File a Complaint
        </Link>
      </div>

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
            placeholder="Search by complaint number..."
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
            {categoryOptions.map((opt) => (
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
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value);
            }}
            className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearchInput('');
                setStatus('');
                setCategory('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-sm font-semibold text-accent-dark hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <PackageSearch size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No complaints found</p>
            <p className="mt-1 text-sm text-ink-muted">
              {hasActiveFilters ? 'Try adjusting your filters.' : "You haven't filed any complaints yet."}
            </p>
            {!hasActiveFilters && (
              <Link
                href="/customer/complaints/new"
                className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                File a Complaint
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-raised md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Complaint #</th>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Updated</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complaints.map((c) => (
                    <tr key={c.complaintId}>
                      <td className="px-5 py-3 font-medium text-ink">{c.complaintNumber}</td>
                      <td className="px-5 py-3 text-ink-muted">{c.title}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted">
                          {categoryOptions.find((opt) => opt.value === c.category)?.label || c.category}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {new Date(c.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/customer/complaints/${c.complaintId}`}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {complaints.map((c) => (
                <Link
                  key={c.complaintId}
                  href={`/customer/complaints/${c.complaintId}`}
                  className="block rounded-2xl border border-border bg-surface-raised p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{c.complaintNumber}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-muted">{c.title}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Submitted {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </Link>
              ))}
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
