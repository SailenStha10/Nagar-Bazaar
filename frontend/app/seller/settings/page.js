'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Check } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

export default function SellerSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ shopName: '', description: '', location: '', contact: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'seller') return;
    api
      .get('/sellers/profile')
      .then((res) => {
        const d = res.data.data;
        setForm({
          shopName: d.shopName || '',
          description: d.description || '',
          location: d.location || '',
          contact: d.contact || '',
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNeedsRegistration(true);
        } else {
          setError(err.response?.data?.message || 'Failed to load store information');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSaved(false);
    try {
      await api.put('/sellers/profile', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store information');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'seller' || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 h-96 animate-pulse rounded-2xl border border-border bg-surface-raised" />
      </div>
    );
  }

  if (needsRegistration) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-display text-xl font-semibold text-ink">Set up your store first</p>
        <p className="mt-2 text-sm text-ink-muted">
          Create your seller profile from the dashboard before editing store settings.
        </p>
        <Link
          href="/seller/dashboard"
          className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings size={20} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Store</span>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Settings</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-muted">Update the store information customers see on your storefront.</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface-raised p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-accent-light px-4 py-2.5 text-sm text-accent-dark">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-ink">Shop Name</label>
            <input
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Contact Number</label>
            <input
              name="contact"
              value={form.contact}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Address / Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
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

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saved && <Check size={16} />}
            {submitting ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
