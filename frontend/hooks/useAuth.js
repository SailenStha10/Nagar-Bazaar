'use client';

import { useContext, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';

export default function useAuth() {
  const ctx = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const login = async (email, password) => {
    setSubmitting(true);
    setError(null);
    try {
      return await ctx.login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (data) => {
    setSubmitting(true);
    setError(null);
    try {
      return await ctx.register(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => ctx.logout();
  const getCurrentUser = () => ctx.user;

  return {
    user: ctx.user,
    token: ctx.token,
    loading: ctx.loading,
    submitting,
    error,
    login,
    register,
    logout,
    getCurrentUser,
  };
}
