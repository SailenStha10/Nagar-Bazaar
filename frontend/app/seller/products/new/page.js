'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import SellerProductForm from '@/components/SellerProductForm';

export default function NewSellerProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (payload) => {
    await api.post('/sellers/products', payload);
    router.push('/seller/products');
  };

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Inventory</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Add New Product</h1>
      <p className="mt-1 text-sm text-ink-muted">List a new product in your store.</p>

      <div className="mt-8">
        <SellerProductForm onSubmit={handleSubmit} submitLabel="Add Product" />
      </div>
    </div>
  );
}
