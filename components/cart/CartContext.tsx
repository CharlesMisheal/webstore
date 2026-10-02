'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, FitType } from '@/lib/types';
import { calculateLineTotal } from '@/lib/money';

interface CartContextType {
  items: CartItem[];
  subtotalKobo: number;
  totalCount: number;
  currency: 'NGN' | 'USD' | 'GBP';
  setCurrency: (c: 'NGN' | 'USD' | 'GBP') => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQty: (itemId: string, qty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aplus_cart_v1';
const CURRENCY_STORAGE_KEY = 'aplus_currency_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<'NGN' | 'USD' | 'GBP'>('NGN');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (storedCurrency === 'USD' || storedCurrency === 'GBP' || storedCurrency === 'NGN') {
        setCurrencyState(storedCurrency);
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [items, isInitialized]);

  const setCurrency = (c: 'NGN' | 'USD' | 'GBP') => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Find matching item by variant and fit_type
      const existingIdx = prev.findIndex(
        (i) => i.variant_id === newItem.variant_id && i.fit_type === newItem.fit_type
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].qty += newItem.qty;
        return updated;
      } else {
        const itemWithId: CartItem = {
          ...newItem,
          id: `${newItem.variant_id}_${newItem.fit_type}_${Date.now()}`,
        };
        return [...prev, itemWithId];
      }
    });
    setIsCartOpen(true);
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: Math.min(20, Math.floor(qty)) } : i))
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotalKobo = items.reduce(
    (sum, item) => sum + calculateLineTotal(item.unit_price_kobo, item.qty),
    0
  );

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotalKobo,
        totalCount,
        currency,
        setCurrency,
        isCartOpen,
        setIsCartOpen,
        addItem,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
