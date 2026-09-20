'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Leaf, MessageSquareWarning } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { dashboardPathForRole } from '@/utils/roles';

const highlights = [
  { icon: ShieldCheck, text: 'Shop from officer-verified local sellers' },
  { icon: Leaf, text: 'Discover authentic Nepali products' },
  { icon: MessageSquareWarning, text: 'Track complaints with full transparency' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, submitting, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      router.push(dashboardPathForRole(user.role));
    } catch {
      // error state handled by useAuth
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary-light/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/85">
            <ShieldCheck size={14} className="text-accent" />
            Government-aligned marketplace
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight">
            Welcome back to Nagar Bazaar
          </h1>
          <p className="mt-4 text-white/70">
            Sign in to continue shopping local, tracking orders, and staying connected to civic
            services.
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
          <h2 className="font-display text-2xl font-semibold text-ink">Login to your account</h2>
          <p className="mt-1 text-sm text-ink-muted">Welcome back! Please enter your details.</p>

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
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor="remember" className="text-sm text-ink-muted">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
