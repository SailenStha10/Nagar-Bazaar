'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Store, Users } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { dashboardPathForRole } from '@/utils/roles';

const highlights = [
  { icon: Users, text: 'Join as a citizen to shop and file complaints' },
  { icon: Store, text: 'Register as a seller and reach verified buyers' },
  { icon: ShieldCheck, text: 'Every seller goes through officer verification' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, submitting, error } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer',
    terms: false,
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Invalid email address';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.terms) return 'You must accept the terms and conditions';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError('');

    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
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
            Join the Nagar Bazaar community
          </h1>
          <p className="mt-4 text-white/70">
            One account, two ways to participate &mdash; shop local or grow your business on a
            trusted, verified platform.
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
          <h2 className="font-display text-2xl font-semibold text-ink">Create an account</h2>
          <p className="mt-1 text-sm text-ink-muted">Join Nagar Bazaar as a customer or seller.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {(formError || error) && (
              <div className="rounded-lg bg-accent-light px-4 py-2.5 text-sm text-accent-dark">
                {formError || error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                required
              />
            </div>

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
              <label htmlFor="phone" className="block text-sm font-medium text-ink">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink">
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  required
                />
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-ink">I am registering as a</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { value: 'customer', label: 'Customer' },
                  { value: 'seller', label: 'Seller' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      form.role === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-ink-muted hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={form.role === option.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={form.terms}
                onChange={handleChange}
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor="terms" className="text-sm text-ink-muted">
                I agree to the Terms and Conditions
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
