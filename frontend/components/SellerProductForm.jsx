'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageIcon, Trash2 } from 'lucide-react';
import api from '@/utils/api';

const emptyForm = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  stock: '',
  image: '',
  isLocal: false,
  producer: '',
  location: '',
  discountType: 'none',
  discountValue: '',
};

export default function SellerProductForm({ initialValues, onSubmit, onDelete, submitLabel = 'Save Product' }) {
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || '',
        description: initialValues.description || '',
        categoryId: initialValues.categoryId?._id || initialValues.categoryId || '',
        price: initialValues.price ?? '',
        stock: initialValues.stock ?? '',
        image: initialValues.image || '',
        isLocal: Boolean(initialValues.isLocal),
        producer: initialValues.localProductDetails?.producer || '',
        location: initialValues.localProductDetails?.location || '',
        discountType: initialValues.discountType || 'none',
        discountValue: initialValues.discountValue ? String(initialValues.discountValue) : '',
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Product name is required';
    if (!form.categoryId) next.categoryId = 'Please select a category';
    if (form.price === '' || Number(form.price) <= 0) next.price = 'Price must be greater than 0';
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Stock cannot be negative';
    if (form.isLocal) {
      if (!form.producer.trim()) next.producer = 'Producer name is required for local products';
      if (!form.location.trim()) next.location = 'Location is required for local products';
    }
    if (form.discountType !== 'none') {
      const value = Number(form.discountValue);
      if (form.discountValue === '' || value <= 0) {
        next.discountValue = 'Enter a discount value greater than 0';
      } else if (form.discountType === 'percentage' && value > 100) {
        next.discountValue = 'Percentage cannot exceed 100';
      } else if (form.discountType === 'flat' && form.price !== '' && value >= Number(form.price)) {
        next.discountValue = 'Discounted price must be less than the regular price';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim(),
      isLocal: form.isLocal,
      localProductDetails: form.isLocal
        ? { producer: form.producer.trim(), location: form.location.trim() }
        : undefined,
      discountType: form.discountType,
      discountValue: form.discountType === 'none' ? 0 : Number(form.discountValue),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete product');
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{formError}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 rounded-2xl border border-border bg-surface-raised p-6">
          <div>
            <label className="block text-sm font-medium text-ink">Product Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {errors.name && <p className="mt-1 text-xs text-accent-dark">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink">Category</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-accent-dark">{errors.categoryId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Image URL</label>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink">Price (NPR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
              {errors.price && <p className="mt-1 text-xs text-accent-dark">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Stock</label>
              <input
                type="number"
                min="0"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
              {errors.stock && <p className="mt-1 text-xs text-accent-dark">{errors.stock}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-ink">Sale / Discount</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Only products with a discount set here appear in the customer &ldquo;Sale &amp; Discounted&rdquo; section.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted">Discount Type</label>
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="none">No discount</option>
                  <option value="percentage">Percentage off</option>
                  <option value="flat">Flat sale price</option>
                </select>
              </div>
              {form.discountType !== 'none' && (
                <div>
                  <label className="block text-xs font-medium text-ink-muted">
                    {form.discountType === 'percentage' ? 'Percentage (%)' : 'Sale Price (NPR)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={form.discountType === 'percentage' ? '1' : '0.01'}
                    max={form.discountType === 'percentage' ? '100' : undefined}
                    name="discountValue"
                    value={form.discountValue}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  {errors.discountValue && <p className="mt-1 text-xs text-accent-dark">{errors.discountValue}</p>}
                </div>
              )}
            </div>

            {form.discountType !== 'none' && form.price !== '' && form.discountValue !== '' && !errors.discountValue && (
              <p className="mt-3 text-sm text-ink">
                Customers will see{' '}
                <span className="font-semibold text-local">
                  NPR{' '}
                  {(form.discountType === 'percentage'
                    ? Number(form.price) * (1 - Number(form.discountValue) / 100)
                    : Number(form.discountValue)
                  ).toLocaleString('en-NP', { maximumFractionDigits: 2 })}
                </span>{' '}
                <span className="text-ink-muted line-through">NPR {Number(form.price).toLocaleString('en-NP')}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
              <input
                type="checkbox"
                name="isLocal"
                checked={form.isLocal}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              This is a Local Product
            </label>

            {form.isLocal && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted">Producer Name</label>
                  <input
                    name="producer"
                    value={form.producer}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  {errors.producer && <p className="mt-1 text-xs text-accent-dark">{errors.producer}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted">Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  {errors.location && <p className="mt-1 text-xs text-accent-dark">{errors.location}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Image Preview</p>
            <div className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-surface-alt">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <ImageIcon size={28} className="text-ink-muted" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-accent-dark/30 py-3 text-sm font-semibold text-accent-dark hover:bg-accent-light disabled:opacity-60"
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting...' : 'Delete Product'}
            </button>
          )}

          <Link href="/seller/products" className="block text-center text-sm font-semibold text-ink-muted hover:text-primary">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
