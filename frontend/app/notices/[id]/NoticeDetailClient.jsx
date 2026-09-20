'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Printer, ShoppingBag, Info, FileWarning, Scale, DollarSign } from 'lucide-react';
import api from '@/utils/api';

const categoryMeta = {
  market_info: { label: 'Market Info', icon: ShoppingBag },
  consumer_awareness: { label: 'Consumer Awareness', icon: Info },
  public_notice: { label: 'Public Notice', icon: FileWarning },
  regulations: { label: 'Regulations', icon: Scale },
  price_info: { label: 'Price Info', icon: DollarSign },
};

const priorityBadge = {
  high: 'bg-accent-dark text-white',
  medium: 'bg-accent-light text-accent-dark',
  low: 'bg-surface-alt text-ink-muted',
};

export default function NoticeDetailClient({ id }) {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/notices/${id}`)
      .then((res) => setNotice(res.data.data))
      .catch(() => setError('Notice not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-10">
        <div className="h-8 w-48 rounded bg-surface-alt" />
        <div className="mt-6 h-64 rounded-2xl bg-surface-alt" />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Notice not found'}</p>
        <Link href="/notices" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Back to Notices
        </Link>
      </div>
    );
  }

  const meta = categoryMeta[notice.category] || categoryMeta.public_notice;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/notices" className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-primary">
        <ArrowLeft size={15} />
        Back to Notices
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-surface-raised p-8 print:border-none print:p-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted">
            <meta.icon size={12} />
            {meta.label}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityBadge[notice.priority]}`}>
            {notice.priority} priority
          </span>
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">{notice.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {notice.issuedBy?.name && `Issued by ${notice.issuedBy.name}`}
          {notice.issuedBy?.department ? `, ${notice.issuedBy.department}` : ''}
          {' · '}
          {new Date(notice.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink">{notice.content}</div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5 print:hidden">
          <p className="text-xs text-ink-muted">{notice.viewCount} view{notice.viewCount === 1 ? '' : 's'}</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
