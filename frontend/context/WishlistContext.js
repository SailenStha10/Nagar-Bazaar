'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext(null);

const storageKey = (userId) => `wishlist:${userId}`;

export function WishlistProvider({ children }) {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.userId;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey(userId));
      setItems(stored ? JSON.parse(stored) : []);
    } catch {
      setItems([]);
    }
  }, [userId]);

  const persist = useCallback(
    (next) => {
      setItems(next);
      if (userId) {
        try {
          localStorage.setItem(storageKey(userId), JSON.stringify(next));
        } catch {
          // storage unavailable — keep in-memory state only
        }
      }
    },
    [userId]
  );

  const isWishlisted = useCallback((productId) => items.some((p) => p._id === productId), [items]);

  const toggleWishlist = useCallback(
    (product) => {
      const exists = items.some((p) => p._id === product._id);
      const next = exists ? items.filter((p) => p._id !== product._id) : [...items, product];
      persist(next);
      return !exists;
    },
    [items, persist]
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      persist(items.filter((p) => p._id !== productId));
    },
    [items, persist]
  );

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
