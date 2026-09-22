'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus, Megaphone, Eye, Pencil, Archive, Trash2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const priorityBadge = {
  high: 'bg-accent-dark text-white',
  medium: 'bg-accent-light text-accent-dark',
  low: 'bg-surface-alt text-ink-muted',
};

export default function GovernmentNoticesPage() {
  return (
    <Suspense fallback={null}>
      <NoticesManagement />
    </Suspense>
  );
}

// Reused verbatim at /admin/notices (see app/admin/notices/page.js) — the
// base path is derived from the URL so links and the auth-redirect stay
// inside whichever role's area it's mounted under.
function NoticesManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const basePath = pathname.startsWith('/admin') ? '/admin' : '/government';

  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push(basePath === '/admin' ? '/admin' : '/login');
    }
  }, [authLoading, user, router, basePath]);

  const loadNotices = () => {
    setLoading(true);
    setError('');
    const params = { page, limit: 10, archived: showArchived };
    if (category) params.category = category;
    api
      .get('/notices', { params })
      .then((res) => {
        setNotices(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load notices'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    loadNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, category, showArchived]);

  const handleArchive = async (noticeId) => {
    if (!window.confirm('Archive this notice? It will no longer appear publicly.')) return;
    setActionError('');
    try {
      await api.put(`/notices/${noticeId}/archive`);
      loadNotices();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to archive notice');
    }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Permanently delete this notice? This cannot be undone.')) return;
    setActionError('');
    try {
      await api.delete(`/notices/${noticeId}`);
      loadNotices();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  if (!user || !['officer', 'admin'].includes(user.role)) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Manage Notices</h1>
        </div>
        <Link
          href={`${basePath}/notices/new`}
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={15} />
          Create Notice
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          <option value="market_info">Market Info</option>
          <option value="consumer_awareness">Consumer Awareness</option>
          <option value="public_notice">Public Notice</option>
          <option value="regulations">Regulations</option>
          <option value="price_info">Price Info</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => {
              setPage(1);
              setShowArchived(e.target.checked);
            }}
          />
          Show archived
        </label>
      </div>

      {(error || actionError) && (
        <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error || actionError}</div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Megaphone size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No notices found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Published</th>
                    <th className="px-5 py-3">Views</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {notices.map((n) => (
                    <tr key={n.noticeId}>
                      <td className="px-5 py-3 font-medium text-ink">{n.title}</td>
                      <td className="px-5 py-3 text-ink-muted capitalize">{n.category.replace('_', ' ')}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityBadge[n.priority]}`}>
                          {n.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {new Date(n.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{n.viewCount}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/notices/${n.noticeId}`} className="rounded-full border border-border p-1.5 text-ink-muted hover:border-primary hover:text-primary" title="View">
                            <Eye size={14} />
                          </Link>
                          <Link href={`${basePath}/notices/${n.noticeId}/edit`} className="rounded-full border border-border p-1.5 text-ink-muted hover:border-primary hover:text-primary" title="Edit">
                            <Pencil size={14} />
                          </Link>
                          {user.role === 'admin' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleArchive(n.noticeId)}
                                className="rounded-full border border-border p-1.5 text-ink-muted hover:border-primary hover:text-primary"
                                title="Archive"
                              >
                                <Archive size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(n.noticeId)}
                                className="rounded-full border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
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
