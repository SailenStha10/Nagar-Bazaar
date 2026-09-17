'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import SellerProductForm from '@/components/SellerProductForm';

export default function EditSellerProductClient({ id }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'seller')) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'seller') return;
    let ignore = false;
    setLoading(true);
    api
      .get(`/sellers/products/${id}`)
      .then((res) => {
        if (!ignore) setProduct(res.data.data);
      })
      .catch(() => {
        if (!ignore) setError('Product not found.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, user]);

  const handleSubmit = async (payload) => {
    await api.put(`/sellers/products/${id}`, payload);
    router.push('/seller/products');
  };

  const handleDelete = async () => {
    await api.delete(`/sellers/products/${id}`);
    router.push('/seller/products');
  };

  if (!user || user.role !== 'seller' || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-alt" />
        <div className="mt-8 h-96 animate-pulse rounded-2xl border border-border bg-surface-raised" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <AlertCircle size={36} className="text-accent-dark" />
        <p className="mt-4 font-display text-xl font-semibold text-ink">{error || 'Product not found'}</p>
        <Link
          href="/seller/products"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Inventory</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Edit Product</h1>
      <p className="mt-1 text-sm text-ink-muted">Update details for {product.name}.</p>

      <div className="mt-8">
        <SellerProductForm
          initialValues={product}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
