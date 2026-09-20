'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LayoutDashboard, Users, Store } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

const highlights = [
  { icon: LayoutDashboard, text: 'System-wide statistics and analytics' },
  { icon: Users, text: 'Manage users, sellers, and officers' },
  { icon: Store, text: 'Assign complaints and oversee the marketplace' },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, submitting, error, logout } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.email || !form.password) {
      setFormError('Email and password are required');
      return;
    }

    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        logout();
        setFormError('This account does not have admin access.');
        return;
      }
      router.push('/admin/dashboard');
    } catch {
      // error state handled by useAuth
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary-dark px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary-light/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/85">
            <ShieldAlert size={14} className="text-accent" />
            Restricted access
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight">
            Nagar Bazaar Admin
          </h1>
          <p className="mt-4 text-white/70">
            The central control panel for the platform — users, sellers, products, complaints,
            officers, and notices, all in one place.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-accent">
                  <item.icon size={16} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert size={20} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Admin Sign In</h2>
          <p className="mt-1 text-sm text-ink-muted">Authorized personnel only.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {(formError || error) && (
              <div className="rounded-lg bg-accent-light px-4 py-2.5 text-sm text-accent-dark">
                {formError || error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary-dark py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
