'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import NoticeForm from '@/components/NoticeForm';

export default function NewNoticePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['officer', 'admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (!user || !['officer', 'admin'].includes(user.role)) return null;

  const handleSubmit = async (payload) => {
    await api.post('/notices', payload);
    setSuccess(true);
    setTimeout(() => router.push('/government/notices'), 800);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Oversight</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Create Notice</h1>
      <p className="mt-1 text-sm text-ink-muted">Publish an official announcement for citizens and sellers.</p>

      {success && (
        <div className="mt-6 rounded-lg bg-local-light px-4 py-3 text-sm text-local">Notice published successfully. Redirecting...</div>
      )}

      <div className="mt-6">
        <NoticeForm onSubmit={handleSubmit} submitLabel="Publish Notice" />
      </div>
    </div>
  );
}
