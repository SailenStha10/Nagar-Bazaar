'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ShieldCheck,
  Store,
  Package,
  Users,
  ClipboardCheck,
  UserCog,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api, { getFileUrl } from '@/utils/api';
import ComplaintTimeline from '@/components/ComplaintTimeline';

const categoryLabel = {
  overpricing: 'Overpricing',
  expired_product: 'Expired Product',
  quality_issue: 'Quality Issue',
  misleading_info: 'Misleading Info',
  seller_issue: 'Seller Issue',
  other: 'Other',
};

const statusBadge = {
  submitted: 'bg-accent-light text-accent-dark',
  under_review: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-local-light text-local',
};

export default function OfficerComplaintClient({ id }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [sellerDetail, setSellerDetail] = useState(null);
  const [citizenHistory, setCitizenHistory] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const loadComplaint = () => {
    setLoading(true);
    setError('');
    api
      .get(`/complaints/${id}`)
      .then((res) => setComplaint(res.data.data))
      .catch(() => setError('Complaint not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    loadComplaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    if (!complaint) return;
    if (complaint.seller?._id) {
      api.get(`/sellers/${complaint.seller._id}`).then((res) => setSellerDetail(res.data.data)).catch(() => {});
    }
    if (complaint.submittedBy?._id) {
      api
        .get('/complaints', { params: { submittedBy: complaint.submittedBy._id, limit: 5 } })
        .then((res) => setCitizenHistory(res.data))
        .catch(() => {});
    }
  }, [complaint]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/officers').then((res) => setOfficers(res.data.data || [])).catch(() => {});
    }
  }, [user]);

  const handleStatusUpdate = async (status) => {
    if (!window.confirm(`Update status to "${status.replace('_', ' ')}"?`)) return;
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/status`, { status, officerRemarks: remarks.trim() || undefined });
      setRemarks('');
      loadComplaint();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (resolutionText.trim().length < 5) {
      setActionError('Please provide resolution details');
      return;
    }
    if (!window.confirm('Mark this complaint as resolved? This cannot be undone.')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/resolve`, {
        resolution: resolutionText.trim(),
        officerRemarks: resolutionRemarks.trim() || undefined,
      });
      setShowResolveForm(false);
      loadComplaint();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to resolve complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedOfficerId) return;
    if (!window.confirm('Reassign this complaint to the selected officer?')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/assign`, { officerId: selectedOfficerId });
      setShowReassign(false);
      loadComplaint();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign officer');
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

  if (error || !complaint) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Complaint not found'}</p>
        <Link href="/government/complaints" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Back to Queue
        </Link>
      </div>
    );
  }

  const isResolved = complaint.status === 'resolved';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm font-semibold text-ink">
              {complaint.complaintNumber}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadge[complaint.status]}`}>
              {complaint.status.replace('_', ' ')}
            </span>
            <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted">
              {categoryLabel[complaint.category] || complaint.category}
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{complaint.title}</h1>
          <p className="mt-1 text-xs text-ink-muted">
            Submitted {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
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
          {/* Description */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-base font-semibold text-ink">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{complaint.description}</p>

            {complaint.attachments?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {complaint.attachments.map((url, i) => (
                  <a key={i} href={getFileUrl(url)} target="_blank" rel="noreferrer" className="h-16 w-16 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFileUrl(url)} alt={`Attachment ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-base font-semibold text-ink">Timeline</h2>
            <div className="mt-4">
              <ComplaintTimeline timeline={complaint.timeline} currentStatus={complaint.status} />
            </div>
          </div>

          {/* Officer actions */}
          {!isResolved && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={17} className="text-primary" />
                <h2 className="font-display text-base font-semibold text-ink">Officer Actions</h2>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-ink">Remarks (optional)</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add a note for this status change..."
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {complaint.status !== 'under_review' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate('under_review')}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    Mark as Under Review
                  </button>
                )}
                {complaint.status !== 'in_progress' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate('in_progress')}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    Mark as In Progress
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowResolveForm((v) => !v)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Resolve Complaint
                </button>
              </div>

              {showResolveForm && (
                <form onSubmit={handleResolve} className="mt-5 space-y-3 rounded-xl border border-border bg-surface-alt p-4">
                  <div>
                    <label className="block text-sm font-medium text-ink">Resolution</label>
                    <textarea
                      rows={3}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Describe how this complaint was resolved..."
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">Officer Remarks (optional)</label>
                    <input
                      value={resolutionRemarks}
                      onChange={(e) => setResolutionRemarks(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-ink-muted">
                    Signed by {user.name} &middot; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-full bg-local px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Resolution'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Resolution (if resolved) */}
          {isResolved && complaint.resolution && (
            <div className="rounded-2xl border border-local/30 bg-local-light p-6">
              <div className="flex items-center gap-2 text-local">
                <ClipboardCheck size={17} />
                <h2 className="font-display text-base font-semibold">Resolution</h2>
              </div>
              <p className="mt-2 text-sm text-ink">{complaint.resolution}</p>
              {complaint.officerRemarks && <p className="mt-2 text-xs text-ink-muted">Remarks: {complaint.officerRemarks}</p>}
              {complaint.resolvedAt && (
                <p className="mt-3 text-xs text-ink-muted">
                  Resolved on {new Date(complaint.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Citizen info */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h2 className="font-display text-sm font-semibold text-ink">Citizen</h2>
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{complaint.submittedBy?.name}</p>
            <p className="text-xs text-ink-muted">{complaint.submittedBy?.email}</p>
            <p className="text-xs text-ink-muted">{complaint.submittedBy?.phone}</p>
            {citizenHistory && (
              <p className="mt-3 text-xs text-ink-muted">
                {citizenHistory.pagination.total} total complaint{citizenHistory.pagination.total === 1 ? '' : 's'} filed
              </p>
            )}
          </div>

          {/* Seller / product info */}
          {(complaint.seller || complaint.product) && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-primary" />
                <h2 className="font-display text-sm font-semibold text-ink">Related</h2>
              </div>
              {complaint.seller && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-ink">{complaint.seller.shopName}</p>
                  {sellerDetail && (
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        sellerDetail.verificationStatus === 'approved' ? 'bg-local-light text-local' : 'bg-accent-light text-accent-dark'
                      }`}
                    >
                      <ShieldCheck size={10} />
                      {sellerDetail.verificationStatus}
                    </span>
                  )}
                  {sellerDetail && <p className="mt-1 text-xs text-ink-muted">{sellerDetail.productCount} products listed</p>}
                </div>
              )}
              {complaint.product && (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-ink">
                  <Package size={13} />
                  {complaint.product.name}
                </div>
              )}
              {complaint.relatedOrder && (
                <p className="mt-2 text-xs text-ink-muted">Order: {complaint.relatedOrder.orderNumber}</p>
              )}
            </div>
          )}

          {/* Assignment */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-2">
              <UserCog size={16} className="text-primary" />
              <h2 className="font-display text-sm font-semibold text-ink">Assignment</h2>
            </div>
            <p className="mt-3 text-sm text-ink">
              {complaint.assignedOfficer ? complaint.assignedOfficer.name : <span className="text-accent-dark">Unassigned</span>}
            </p>
            {complaint.assignedOfficer?.department && <p className="text-xs text-ink-muted">{complaint.assignedOfficer.department}</p>}

            {user.role === 'admin' && (
              <div className="mt-3">
                {!showReassign ? (
                  <button
                    type="button"
                    onClick={() => setShowReassign(true)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {complaint.assignedOfficer ? 'Reassign' : 'Assign Officer'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select an officer</option>
                      {officers.map((o) => (
                        <option key={o.officerId} value={o.officerId}>
                          {o.name} &middot; {o.assignedCount} active
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!selectedOfficerId || actionLoading}
                        onClick={handleReassign}
                        className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReassign(false)}
                        className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
