'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users as UsersIcon, Ban, CheckCircle2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const roleBadge = {
  customer: 'bg-primary/10 text-primary',
  seller: 'bg-accent-light text-accent-dark',
  officer: 'bg-local-light text-local',
  admin: 'bg-surface-alt text-ink-muted',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = () => {
    setLoading(true);
    setError('');
    const params = { page, limit: 10 };
    if (role) params.role = role;
    if (status) params.status = status;
    if (debouncedSearch) params.q = debouncedSearch;

    api
      .get('/admin/users', { params })
      .then((res) => {
        setUsers(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, role, status, debouncedSearch]);

  const handleToggleActive = async (u) => {
    const nextActive = !u.isActive;
    if (!window.confirm(`${nextActive ? 'Unblock' : 'Block'} ${u.name}?`)) return;
    setActionError('');
    try {
      await api.put(`/admin/users/${u._id}/status`, { isActive: nextActive });
      loadUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">User Management</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setPage(1);
              setSearchInput(e.target.value);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <UsersIcon size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="px-5 py-3 font-medium text-ink">{u.name}</td>
                      <td className="px-5 py-3 text-ink-muted">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadge[u.role]}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? 'bg-local-light text-local' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-border text-ink hover:border-primary hover:text-primary'
                            }`}
                          >
                            {u.isActive ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                            {u.isActive ? 'Block' : 'Unblock'}
                          </button>
                        )}
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
