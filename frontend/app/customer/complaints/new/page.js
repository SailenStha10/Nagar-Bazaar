'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  Search,
  X,
  Copy,
  CheckCircle2,
  Upload,
  Store,
  Package,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

const categories = [
  { value: 'overpricing', label: 'Overpricing' },
  { value: 'expired_product', label: 'Expired Product' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'misleading_info', label: 'Misleading Info' },
  { value: 'seller_issue', label: 'Seller Issue' },
  { value: 'other', label: 'Other' },
];

const MAX_ATTACHMENTS = 3;

export default function NewComplaintPage() {
  return (
    <Suspense fallback={null}>
      <NewComplaintForm />
    </Suspense>
  );
}

function NewComplaintForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [category, setCategory] = useState('');
  const [targetMode, setTargetMode] = useState('product');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [sellerSearch, setSellerSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orders, setOrders] = useState([]);
  const [relatedOrderId, setRelatedOrderId] = useState(searchParams.get('orderId') || '');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/sellers', { params: { limit: 50 } }).then((res) => setSellers(res.data.data || [])).catch(() => {});
    api.get('/orders', { params: { limit: 50 } }).then((res) => setOrders(res.data.data || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get('/products/search', { params: { q: productSearch, limit: 6 } })
        .then((res) => setProductResults(res.data.data || []))
        .catch(() => setProductResults([]));
    }, 350);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const filteredSellers = sellers.filter((s) =>
    s.shopName.toLowerCase().includes(sellerSearch.trim().toLowerCase())
  );

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length < files.length) {
      setErrors((prev) => ({ ...prev, attachments: 'Only image files are supported' }));
    } else {
      setErrors((prev) => ({ ...prev, attachments: undefined }));
    }
    setAttachments((prev) => [...prev, ...validFiles].slice(0, MAX_ATTACHMENTS));
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCategory('');
    setTargetMode('product');
    setProductSearch('');
    setProductResults([]);
    setSelectedProduct(null);
    setSellerSearch('');
    setSelectedSeller(null);
    setTitle('');
    setDescription('');
    setRelatedOrderId('');
    setAttachments([]);
    setErrors({});
    setSubmitError('');
  };

  const validate = () => {
    const next = {};
    if (!category) next.category = 'Please select a category';
    if (!selectedProduct && !selectedSeller) next.target = 'Please select a product or a seller';
    if (title.trim().length < 10) next.title = 'Title must be at least 10 characters';
    if (description.trim().length < 20) next.description = 'Description must be at least 20 characters';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      let attachmentUrls = [];
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((file) => formData.append('files', file));
        const uploadRes = await api.post('/uploads', formData);
        attachmentUrls = uploadRes.data.data.urls;
      }

      const res = await api.post('/complaints', {
        category,
        title: title.trim(),
        description: description.trim(),
        sellerId: selectedSeller?._id,
        productId: selectedProduct?._id,
        relatedOrderId: relatedOrderId || undefined,
        attachments: attachmentUrls,
      });
      setSuccessData(res.data.data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!successData) return;
    navigator.clipboard?.writeText(successData.complaintNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || user.role !== 'customer') return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Services</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">File a Complaint</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Report pricing, quality, or seller issues. Officers review every complaint submitted.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        {/* Category */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Complaint Category</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((c) => (
              <label
                key={c.value}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
                  category === c.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-ink-muted hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={(e) => setCategory(e.target.value)}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
          {errors.category && <p className="mt-2 text-xs text-accent-dark">{errors.category}</p>}
        </div>

        {/* Product / Seller selection */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">What is this about?</h2>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTargetMode('product')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                targetMode === 'product' ? 'bg-primary text-white' : 'bg-surface-alt text-ink-muted'
              }`}
            >
              <Package size={14} />A Product
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('seller')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                targetMode === 'seller' ? 'bg-primary text-white' : 'bg-surface-alt text-ink-muted'
              }`}
            >
              <Store size={14} />A Seller
            </button>
          </div>

          {targetMode === 'product' ? (
            <div className="mt-4">
              {selectedProduct ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{selectedProduct.name}</p>
                    <p className="text-xs text-ink-muted">NPR {selectedProduct.price?.toLocaleString('en-NP')}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedProduct(null)} className="text-ink-muted hover:text-accent-dark">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search for a product..."
                    className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                  {productResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border">
                      {productResults.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductSearch('');
                            setProductResults([]);
                          }}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-alt"
                        >
                          <span className="text-ink">{p.name}</span>
                          <span className="text-ink-muted">NPR {p.price?.toLocaleString('en-NP')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              {selectedSeller ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{selectedSeller.shopName}</p>
                    <p className="text-xs text-ink-muted">{selectedSeller.location}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedSeller(null)} className="text-ink-muted hover:text-accent-dark">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Search for a seller..."
                    className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                  {sellerSearch.trim() && filteredSellers.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border">
                      {filteredSellers.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setSelectedSeller(s);
                            setSellerSearch('');
                          }}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-alt"
                        >
                          <span className="text-ink">{s.shopName}</span>
                          <span className="text-ink-muted">{s.location}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {errors.target && <p className="mt-2 text-xs text-accent-dark">{errors.target}</p>}
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Complaint Details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {errors.title && <p className="mt-1 text-xs text-accent-dark">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened in detail..."
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {errors.description && <p className="mt-1 text-xs text-accent-dark">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Related Order (optional)</label>
              <select
                value={relatedOrderId}
                onChange={(e) => setRelatedOrderId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">None</option>
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderNumber} &middot; {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6">
          <h2 className="font-display text-base font-semibold text-ink">Attachments (optional)</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Add up to {MAX_ATTACHMENTS} images as evidence (JPEG, PNG, GIF, or WEBP, max 5MB each).
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {attachments.map((file, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-white"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {attachments.length < MAX_ATTACHMENTS && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-ink-muted hover:border-primary hover:text-primary">
                <Upload size={16} />
                <span className="text-[10px]">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAttachmentChange} />
              </label>
            )}
          </div>
          {errors.attachments && <p className="mt-2 text-xs text-accent-dark">{errors.attachments}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>

      {/* Success modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-surface-raised p-8 text-center shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-local-light text-local">
              <CheckCircle2 size={28} />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">Complaint Submitted</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Save this number to track your complaint&apos;s progress.
            </p>

            <button
              type="button"
              onClick={handleCopy}
              className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
            >
              {successData.complaintNumber}
              <Copy size={14} />
            </button>
            {copied && <p className="mt-1 text-xs text-local">Copied to clipboard</p>}

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href={`/customer/complaints/${successData.complaintId}`}
                className="rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Track This Complaint
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  resetForm();
                }}
                className="rounded-full border border-border py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
