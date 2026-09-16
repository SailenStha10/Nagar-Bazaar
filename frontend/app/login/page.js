'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';

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
      router.push(`/${user.role}/dashboard`);
    } catch {
      // error state handled by useAuth
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-[#172033]">Login to Nagar Bazaar</h1>
      <p className="mt-1 text-sm text-gray-600">Welcome back! Please enter your details.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {(formError || error) && (
          <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError || error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#12355B] focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#12355B] focus:outline-none"
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
            className="h-4 w-4"
          />
          <label htmlFor="remember" className="text-sm text-gray-600">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[#12355B] py-2 font-semibold text-white hover:bg-[#0e2a48] disabled:opacity-60"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[#12355B] hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
