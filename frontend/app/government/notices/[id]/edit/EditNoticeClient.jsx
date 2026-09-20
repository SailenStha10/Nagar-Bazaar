'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import NoticeForm from '@/components/NoticeForm';

export default function EditNoticeClient({ id }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !['officer', 'admin'].includes(user.role)) return;
    api
      .get(`/notices/${id}`)
      .then((res) => setNotice(res.data.data))
      .catch(() => setError('Notice not found.'))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (!user || !['officer', 'admin'].includes(user.role) || loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-10">
        <div className="h-8 w-48 rounded bg-surface-alt" />
        <div className="mt-6 h-96 rounded-2xl bg-surface-alt" />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Notice not found'}</p>
        <Link href="/government/notices" className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Back to Notices
        </Link>
      </div>
    );
  }

  const handleSubmit = async (payload) => {
    await api.put(`/notices/${id}`, payload);
    setSuccess(true);
    setTimeout(() => router.push('/government/notices'), 800);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Edit Notice</h1>

      {success && (
        <div className="mt-6 rounded-lg bg-local-light px-4 py-3 text-sm text-local">Notice updated successfully. Redirecting...</div>
      )}

      <div className="mt-6">
        <NoticeForm initialValues={notice} onSubmit={handleSubmit} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
