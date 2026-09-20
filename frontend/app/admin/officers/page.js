'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserCog, Ban, CheckCircle2, X } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const emptyForm = { name: '', email: '', password: '', phone: '', department: '', designation: '', officeLocation: '' };

export default function AdminOfficersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  const loadOfficers = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/officers')
      .then((res) => setOfficers(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load officers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadOfficers();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);
    try {
      await api.post('/admin/officers', form);
      setShowForm(false);
      setForm(emptyForm);
      loadOfficers();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create officer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (officer) => {
    const nextActive = !officer.isActive;
    if (!window.confirm(`${nextActive ? 'Reactivate' : 'Deactivate'} ${officer.name}?`)) return;
    setActionError('');
    try {
      await api.put(`/admin/officers/${officer.officerId}/status`, { isActive: nextActive });
      loadOfficers();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update officer status');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Officer Management</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={15} />
          Create Officer
        </button>
      </div>

      {(error || actionError) && (
        <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error || actionError}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">New Officer Account</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Full Name</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Temporary Password</label>
              <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Department</label>
              <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Designation</label>
              <input value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Office Location</label>
              <input value={form.officeLocation} onChange={(e) => setForm((f) => ({ ...f, officeLocation: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Officer'}
          </button>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : officers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <UserCog size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No officers yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Assigned</th>
                  <th className="px-5 py-3">Resolved</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {officers.map((o) => (
                  <tr key={o.officerId}>
                    <td className="px-5 py-3 font-medium text-ink">{o.name}</td>
                    <td className="px-5 py-3 text-ink-muted">{o.department || '—'}</td>
                    <td className="px-5 py-3 text-ink-muted">{o.email}</td>
                    <td className="px-5 py-3 text-ink-muted">{o.assigned}</td>
                    <td className="px-5 py-3 text-ink-muted">{o.resolved} ({o.resolutionRate}%)</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${o.isActive ? 'bg-local-light text-local' : 'bg-red-100 text-red-700'}`}>
                        {o.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(o)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          o.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-border text-ink hover:border-primary hover:text-primary'
                        }`}
                      >
                        {o.isActive ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                        {o.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
