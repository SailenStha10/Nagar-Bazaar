'use client';

import { useContext } from 'react';
import { WishlistContext } from '@/context/WishlistContext';

export default function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
