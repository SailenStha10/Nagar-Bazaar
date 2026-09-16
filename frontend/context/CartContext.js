'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/utils/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext(null);

const emptyCart = { items: [], totalItems: 0, totalPrice: 0 };

export function CartProvider({ children }) {
  const auth = useContext(AuthContext);
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!auth?.token) {
      setCart(emptyCart);
      setInitialized(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/cart');
      setCart(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [auth?.token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/cart/add', { productId, quantity });
      setCart(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/cart/item/${itemId}`, { quantity });
      setCart(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/cart/item/${itemId}`);
      setCart(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.delete('/cart/clear');
      setCart(emptyCart);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (deliveryAddress, paymentMethod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/orders/checkout', { deliveryAddress, paymentMethod });
      setCart(emptyCart);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        initialized,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
