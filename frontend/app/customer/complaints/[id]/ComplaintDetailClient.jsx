'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Copy,
  AlertCircle,
  Printer,
  Package,
  Store,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api, { getFileUrl } from '@/utils/api';
import ComplaintTimeline from '@/components/ComplaintTimeline';

const statusBadge = {
  submitted: 'bg-accent-light text-accent-dark',
  under_review: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-local-light text-local',
};

const statusLabel = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const categoryLabel = {
  overpricing: 'Overpricing',
  expired_product: 'Expired Product',
  quality_issue: 'Quality Issue',
  misleading_info: 'Misleading Info',
  seller_issue: 'Seller Issue',
  other: 'Other',
};

export default function ComplaintDetailClient({ id }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    setLoading(true);
    api
      .get(`/complaints/${id}`)
      .then((res) => {
        if (!ignore) setComplaint(res.data.data);
      })
      .catch(() => {
        if (!ignore) setError('Complaint not found.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, user]);

  const handleCopy = () => {
    if (!complaint) return;
    navigator.clipboard?.writeText(complaint.complaintNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-10">
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
        <Link
          href="/customer/complaints"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Back to My Complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 print:max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm font-semibold text-ink hover:border-primary print:hidden"
            >
              {complaint.complaintNumber}
              <Copy size={13} />
            </button>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[complaint.status]}`}>
              {statusLabel[complaint.status]}
            </span>
            <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted">
              {categoryLabel[complaint.category] || complaint.category}
            </span>
          </div>
          {copied && <p className="mt-1 text-xs text-local">Copied to clipboard</p>}
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{complaint.title}</h1>
          <p className="mt-1 text-xs text-ink-muted">
            Submitted {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary print:hidden"
        >
          <Printer size={15} />
          Print
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-border bg-surface-raised p-6">
            <h2 className="font-display text-base font-semibold text-ink">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{complaint.description}</p>

            {(complaint.product || complaint.seller) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {complaint.product && (
                  <span className="flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1.5 text-xs font-medium text-ink">
                    <Package size={12} />
                    {complaint.product.name}
                  </span>
                )}
                {complaint.seller && (
                  <span className="flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1.5 text-xs font-medium text-ink">
                    <Store size={12} />
                    {complaint.seller.shopName}
                  </span>
                )}
                {complaint.relatedOrder && (
                  <span className="rounded-full bg-surface-alt px-3 py-1.5 text-xs font-medium text-ink">
                    Order {complaint.relatedOrder.orderNumber}
                  </span>
                )}
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

          {/* Resolution */}
          {complaint.status === 'resolved' && complaint.resolution && (
            <div className="rounded-2xl border border-local/30 bg-local-light p-6">
              <div className="flex items-center gap-2 text-local">
                <ClipboardCheck size={17} />
                <h2 className="font-display text-base font-semibold">Resolution</h2>
              </div>
              <p className="mt-2 text-sm text-ink">{complaint.resolution}</p>
              {complaint.officerRemarks && (
                <p className="mt-2 text-xs text-ink-muted">Officer remarks: {complaint.officerRemarks}</p>
              )}
              {complaint.resolvedAt && (
                <p className="mt-3 text-xs text-ink-muted">
                  Resolved on{' '}
                  {new Date(complaint.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {complaint.assignedOfficer && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                <h2 className="font-display text-sm font-semibold text-ink">Assigned Officer</h2>
              </div>
              <p className="mt-3 text-sm font-medium text-ink">{complaint.assignedOfficer.name}</p>
              <p className="text-xs text-ink-muted">{complaint.assignedOfficer.department}</p>
            </div>
          )}

          {complaint.attachments?.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-6">
              <h2 className="font-display text-sm font-semibold text-ink">Attachments</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {complaint.attachments.map((url, i) => (
                  <a
                    key={i}
                    href={getFileUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                    className="h-16 w-16 overflow-hidden rounded-lg border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFileUrl(url)} alt={`Attachment ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
