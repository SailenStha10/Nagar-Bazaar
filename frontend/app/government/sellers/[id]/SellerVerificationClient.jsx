'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Package,
  MessageSquareWarning,
  Landmark,
  Clock,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api, { getFileUrl } from '@/utils/api';

const statusBadge = {
  pending: 'bg-accent-light text-accent-dark',
  approved: 'bg-local-light text-local',
  rejected: 'bg-red-100 text-red-700',
  review_required: 'bg-primary/10 text-primary',
};

const maskAccountNumber = (num) => {
  if (!num) return '—';
  const str = String(num);
  if (str.length <= 4) return str;
  return `${'•'.repeat(str.length - 4)}${str.slice(-4)}`;
};

export default function SellerVerificationClient({ id }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const loadSeller = () => {
    setLoading(true);
    setError('');
    api
      .get(`/verification/sellers/${id}`)
      .then((res) => setSeller(res.data.data))
      .catch(() => setError('Seller not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    loadSeller();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this seller? They will be able to sell on the platform immediately.')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/verification/sellers/${id}/approve`);
      setNotes('');
      loadSeller();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (rejectReason.trim().length < 5) {
      setActionError('Please provide a rejection reason');
      return;
    }
    if (!window.confirm('Reject this seller application?')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/verification/sellers/${id}/reject`, { reason: rejectReason.trim() });
      setShowReject(false);
      setRejectReason('');
      loadSeller();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (reviewReason.trim().length < 5) {
      setActionError('Please provide a review reason');
      return;
    }
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/verification/sellers/${id}/review`, { reviewReason: reviewReason.trim() });
      setShowReview(false);
      setReviewReason('');
      loadSeller();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to mark for review');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || !['officer', 'admin'].includes(user.role) || loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10">
        <div className="h-24 rounded-2xl bg-surface-alt" />
        <div className="mt-6 h-96 rounded-2xl bg-surface-alt" />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Seller not found'}</p>
        <Link href="/government/sellers" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Back to Verification Queue
        </Link>
      </div>
    );
  }

  const canAct = user.role === 'admin';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[seller.status]}`}>
              {seller.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-ink-muted">
              Applied {new Date(seller.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{seller.shopName}</h1>
          <p className="mt-1 text-sm text-ink-muted">{seller.owner?.name}</p>
        </div>
      </div>

      {actionError && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-base font-semibold text-ink">Basic Information</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-muted">Owner Email</dt>
                <dd className="text-sm text-ink">{seller.owner?.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Owner Phone</dt>
                <dd className="text-sm text-ink">{seller.owner?.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Location</dt>
                <dd className="text-sm text-ink">{seller.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Contact</dt>
                <dd className="text-sm text-ink">{seller.contact || '—'}</dd>
              </div>
            </dl>
            {seller.description && (
              <div className="mt-4">
                <dt className="text-xs text-ink-muted">Description</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{seller.description}</dd>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <Landmark size={16} className="text-primary" />
              <h2 className="font-display text-base font-semibold text-ink">Bank Details</h2>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-ink-muted">Account Name</dt>
                <dd className="text-sm text-ink">{seller.bankDetails?.accountName || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Account Number</dt>
                <dd className="text-sm text-ink">{maskAccountNumber(seller.bankDetails?.accountNumber)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Bank Name</dt>
                <dd className="text-sm text-ink">{seller.bankDetails?.bankName || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-primary" />
                <h2 className="font-display text-base font-semibold text-ink">Products ({seller.productsCount})</h2>
              </div>
            </div>
            {seller.products?.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No products listed yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {seller.products.map((p) => (
                  <div key={p._id} className="rounded-xl border border-border p-3">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getFileUrl(p.image)} alt={p.name} loading="lazy" className="h-20 w-full rounded-lg object-cover" />
                    )}
                    <p className="mt-2 truncate text-xs font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-muted">NPR {p.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <MessageSquareWarning size={16} className="text-primary" />
              <h2 className="font-display text-base font-semibold text-ink">Complaint History ({seller.complaintCount})</h2>
            </div>
            {seller.complaintHistory?.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No complaints filed against this seller.</p>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {seller.complaintHistory.map((c) => (
                  <div key={c._id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-ink">{c.title}</p>
                      <p className="text-xs text-ink-muted">{c.complaintNumber}</p>
                    </div>
                    <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold capitalize text-ink-muted">
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h2 className="font-display text-base font-semibold text-ink">Verification Timeline</h2>
            </div>
            {seller.verificationHistory?.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No status changes recorded yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {seller.verificationHistory.map((h, i) => (
                  <li key={i} className="border-l-2 border-border pl-4">
                    <p className="text-sm font-semibold capitalize text-ink">{h.status.replace('_', ' ')}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {h.officerName ? ` · ${h.officerName}` : ''}
                    </p>
                    {h.reason && <p className="mt-1 text-sm text-ink-muted">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-sm font-semibold text-ink">Order Activity</h2>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{seller.totalOrders}</p>
            <p className="text-xs text-ink-muted">Total orders</p>
          </div>

          {canAct && seller.status !== 'approved' && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <h2 className="font-display text-sm font-semibold text-ink">Actions</h2>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-local px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <ShieldCheck size={15} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReject((v) => !v);
                    setShowReview(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <ShieldX size={15} />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReview((v) => !v);
                    setShowReject(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  <ShieldAlert size={15} />
                  Request Review
                </button>
              </div>

              {showReject && (
                <form onSubmit={handleReject} className="mt-4 space-y-3 rounded-xl border border-border bg-surface-alt p-4">
                  <label className="block text-sm font-medium text-ink">Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this application is being rejected..."
                    className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Rejection'}
                  </button>
                </form>
              )}

              {showReview && (
                <form onSubmit={handleReview} className="mt-4 space-y-3 rounded-xl border border-border bg-surface-alt p-4">
                  <label className="block text-sm font-medium text-ink">Review Reason</label>
                  <textarea
                    rows={3}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="What needs to change before approval?"
                    className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting...' : 'Request Review'}
                  </button>
                </form>
              )}
            </div>
          )}

          {seller.status === 'rejected' && seller.rejectionReason && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="font-display text-sm font-semibold text-red-700">Rejection Reason</h2>
              <p className="mt-2 text-sm text-red-700">{seller.rejectionReason}</p>
            </div>
          )}

          {seller.status === 'review_required' && seller.reviewReason && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <h2 className="font-display text-sm font-semibold text-primary">Review Reason</h2>
              <p className="mt-2 text-sm text-ink">{seller.reviewReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
