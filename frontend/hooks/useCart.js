'use client';

import { useContext } from 'react';
import { CartContext } from '@/context/CartContext';

export default function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return {
    cart: ctx.cart,
    loading: ctx.loading,
    initialized: ctx.initialized,
    error: ctx.error,
    getCart: ctx.fetchCart,
    addToCart: ctx.addToCart,
    updateQuantity: ctx.updateQuantity,
    removeItem: ctx.removeItem,
    clearCart: ctx.clearCart,
    checkout: ctx.checkout,
  };
}
