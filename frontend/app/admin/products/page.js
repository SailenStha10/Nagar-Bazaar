'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, Trash2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = () => {
    setLoading(true);
    setError('');
    const params = { page, limit: 12 };
    if (category) params.category = category;
    if (debouncedSearch) params.q = debouncedSearch;
    api
      .get('/admin/products', { params })
      .then((res) => {
        setProducts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, category, debouncedSearch]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Permanently remove "${product.name}" from the system? This cannot be undone.`)) return;
    setActionError('');
    try {
      await api.delete(`/admin/products/${product._id}`);
      loadProducts();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">System Admin</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Product Management</h1>

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
            placeholder="Search by product name..."
            className="w-full rounded-full border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
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
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Package size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Seller</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Rating</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
                      <td className="px-5 py-3 text-ink-muted">{p.seller?.shopName || '—'}</td>
                      <td className="px-5 py-3 text-ink-muted">{p.category?.name || '—'}</td>
                      <td className="px-5 py-3 text-ink">NPR {p.price}</td>
                      <td className="px-5 py-3 text-ink-muted">{p.stock}</td>
                      <td className="px-5 py-3 text-ink-muted">{p.averageRating > 0 ? `${p.averageRating} ★` : '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p._id}`}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="rounded-full border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
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
