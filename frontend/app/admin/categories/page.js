'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Tag, Pencil, Trash2, X } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const emptyForm = { name: '', description: '', icon: '', image: '' };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  const loadCategories = () => {
    setLoading(true);
    setError('');
    api
      .get('/categories/admin')
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadCategories();
  }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '', image: cat.image || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
      } else {
        await api.post('/categories', form);
      }
      setShowForm(false);
      loadCategories();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setActionError('');
    try {
      await api.delete(`/categories/${cat._id}`);
      loadCategories();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Category Management</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={15} />
          New Category
        </button>
      </div>

      {(error || actionError) && (
        <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error || actionError}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">{editingId ? 'Edit Category' : 'New Category'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Icon (emoji)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="🛒"
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Image URL (optional)</label>
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Tag size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No categories yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        <span>{c.icon}</span>
                        {c.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{c.productCount}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.isActive ? 'bg-local-light text-local' : 'bg-surface-alt text-ink-muted'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded-full border border-border p-1.5 text-ink-muted hover:border-primary hover:text-primary"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {c.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="rounded-full border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
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
