'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Star,
  PackageSearch,
  ShoppingBag,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api, { getFileUrl } from '@/utils/api';
import { computeDiscount } from '@/utils/discount';

function ProductThumb({ product, className }) {
  if (!product.image) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-accent-light ${className}`}>
        <ShoppingBag size={16} className="text-primary/50" />
      </span>
    );
  }
  return (
    <span className={`shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-primary/10 to-accent-light ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getFileUrl(product.image)} alt={product.name} className="h-full w-full object-cover" />
    </span>
  );
}

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'stock-asc', label: 'Stock: Low to High' },
];

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('createdAt-desc');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  const loadProducts = () => {
    if (!user || user.role !== 'seller') return;
    setLoading(true);
    setError('');

    const [sortBy, sortOrder] = sort.split('-');
    const params = { page, limit: 10, sortBy, sortOrder };
    if (debouncedSearch) params.q = debouncedSearch;
    if (category) params.category = category;

    api
      .get('/sellers/products', { params })
      .then((res) => {
        setProducts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load products');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, sort, debouncedSearch, category]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product._id);
    try {
      await api.delete(`/sellers/products/${product._id}`);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Inventory</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">My Products</h1>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Toolbar */}
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
            placeholder="Search your products..."
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
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
          className="rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{error}</div>
      )}

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface-raised" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <PackageSearch size={36} className="text-ink-muted" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">No products yet</p>
            <p className="mt-1 text-sm text-ink-muted">Add your first product to start selling.</p>
            <Link
              href="/seller/products/new"
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-raised md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Rating</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => {
                    const { discountPercent, discountedPrice } = computeDiscount(product);
                    return (
                    <tr key={product._id} className={deletingId === product._id ? 'opacity-50' : ''}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb product={product} className="h-10 w-10" />
                          <span className="font-medium text-ink">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{product.categoryId?.name || '—'}</td>
                      <td className="px-5 py-3 text-ink-muted">
                        {discountPercent > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-local">NPR {discountedPrice.toLocaleString('en-NP')}</span>
                            <span className="text-xs text-ink-muted line-through">NPR {product.price.toLocaleString('en-NP')}</span>
                            <span className="rounded-full bg-local-light px-2 py-0.5 text-[10px] font-semibold text-local">
                              -{discountPercent}%
                            </span>
                          </div>
                        ) : (
                          `NPR ${product.price.toLocaleString('en-NP')}`
                        )}
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{product.stock}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.isActive ? 'bg-local-light text-local' : 'bg-surface-alt text-ink-muted'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-accent text-accent" />
                          {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/seller/products/${product._id}/edit`}
                            className="rounded-full p-2 text-ink-muted hover:bg-primary/10 hover:text-primary"
                            aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === product._id}
                            onClick={() => handleDelete(product)}
                            className="rounded-full p-2 text-ink-muted hover:bg-accent-light hover:text-accent-dark disabled:opacity-40"
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {products.map((product) => {
                const { discountPercent, discountedPrice } = computeDiscount(product);
                return (
                <div
                  key={product._id}
                  className={`rounded-2xl border border-border bg-surface-raised p-4 ${
                    deletingId === product._id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ProductThumb product={product} className="h-12 w-12" />
                    <div className="flex-1">
                      <p className="font-medium text-ink">{product.name}</p>
                      <p className="text-xs text-ink-muted">{product.categoryId?.name || '—'}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.isActive ? 'bg-local-light text-local' : 'bg-surface-alt text-ink-muted'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    {discountPercent > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-local">NPR {discountedPrice.toLocaleString('en-NP')}</span>
                        <span className="text-xs text-ink-muted line-through">NPR {product.price.toLocaleString('en-NP')}</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-primary">NPR {product.price.toLocaleString('en-NP')}</span>
                    )}
                    <span className="text-ink-muted">Stock: {product.stock}</span>
                    <span className="flex items-center gap-1 text-ink-muted">
                      <Star size={12} className="fill-accent text-accent" />
                      {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/seller/products/${product._id}/edit`}
                      className="flex-1 rounded-full border border-border py-2 text-center text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === product._id}
                      onClick={() => handleDelete(product)}
                      className="flex-1 rounded-full border border-accent-dark/30 py-2 text-xs font-semibold text-accent-dark hover:bg-accent-light disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
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
