'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CartItem, DisplayCurrency, FitType } from '@/lib/types';
import { calculateLineTotal, DEFAULT_FX_RATES, formatMoney } from '@/lib/money';

type FxRates = { USD: number; GBP: number };

interface CartContextType {
  items: CartItem[];
  subtotalKobo: number;
  totalCount: number;
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  /** Published FX rates from store_settings (display-only; Paystack always charges NGN). */
  fxRates: FxRates;
  /** Formats integer kobo in the shopper's selected display currency. */
  format: (kobo: number) => string;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQty: (itemId: string, qty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aplus_cart_v1';
/** Which signed-in user the cached cart belongs to (absent = guest cart). */
const CART_OWNER_STORAGE_KEY = 'aplus_cart_owner_v1';
const CURRENCY_STORAGE_KEY = 'aplus_currency_v1';
const MAX_LINE_QTY = 20;
const PUSH_DEBOUNCE_MS = 400;
const REFRESH_INTERVAL_MS = 30_000;

type CartResponse = { signedIn: false } | { signedIn: true; userId: string; items: CartItem[] };

const lineId = (variantId: string, fitType: FitType) => `${variantId}_${fitType}`;

/** Order-insensitive fingerprint of what the server stores (variant, fit, qty). */
function linesKey(items: CartItem[]): string {
  return JSON.stringify(items.map((i) => `${i.variant_id}|${i.fit_type}|${i.qty}`).sort());
}

/** Merges lines that share variant + fit, capping quantity. Later lists win on display fields. */
function mergeItems(...lists: CartItem[][]): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const list of lists) {
    for (const item of list) {
      const id = lineId(item.variant_id, item.fit_type);
      const prev = byId.get(id);
      byId.set(id, { ...item, id, qty: Math.min(MAX_LINE_QTY, (prev?.qty ?? 0) + item.qty) });
    }
  }
  return Array.from(byId.values());
}

async function fetchCart(init?: RequestInit): Promise<CartResponse | null> {
  try {
    const res = await fetch('/api/cart', { cache: 'no-store', credentials: 'same-origin', ...init });
    if (res.status === 401) return { signedIn: false };
    if (!res.ok) return null;
    return (await res.json()) as CartResponse;
  } catch {
    return null;
  }
}

export function CartProvider({ children, fxRates = DEFAULT_FX_RATES }: { children: React.ReactNode; fxRates?: FxRates }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<'NGN' | 'USD' | 'GBP'>('NGN');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;
  /** Signed-in user whose server cart we are syncing with; null = guest (local only). */
  const syncUserRef = useRef<string | null>(null);
  /** linesKey of the cart as last confirmed by the server; a differing local cart needs a push. */
  const serverKeyRef = useRef<string>('');
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushInFlightRef = useRef(false);
  const mutatedSinceLoadRef = useRef(false);

  const setOwner = (userId: string | null) => {
    try {
      if (userId) localStorage.setItem(CART_OWNER_STORAGE_KEY, userId);
      else localStorage.removeItem(CART_OWNER_STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const applyServerItems = useCallback((serverItems: CartItem[]) => {
    serverKeyRef.current = linesKey(serverItems);
    setItems(serverItems);
  }, []);

  // Initial load: show the cached cart immediately, then reconcile with the account's saved cart.
  useEffect(() => {
    let localItems: CartItem[] = [];
    let owner: string | null = null;
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) localItems = mergeItems(JSON.parse(stored));
      owner = localStorage.getItem(CART_OWNER_STORAGE_KEY);
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (storedCurrency === 'USD' || storedCurrency === 'GBP' || storedCurrency === 'NGN') {
        setCurrencyState(storedCurrency);
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    setItems(localItems);
    setIsInitialized(true);

    let cancelled = false;
    (async () => {
      const data = await fetchCart();
      if (cancelled || !data) return;

      if (!data.signedIn) {
        syncUserRef.current = null;
        if (owner) {
          // Signed out since this cart was cached: don't leave the account's bag on this device.
          setItems([]);
          setOwner(null);
        }
        return;
      }

      syncUserRef.current = data.userId;
      setOwner(data.userId);
      serverKeyRef.current = linesKey(data.items);

      if (mutatedSinceLoadRef.current) {
        // Shopper changed the bag while we were loading; keep their edits (plus guest items) and push.
        setItems((current) => (owner === data.userId ? current : mergeItems(data.items, current)));
      } else if (!owner && localItems.length > 0) {
        // Guest bag from before sign-in: fold it into the account's saved bag.
        setItems(mergeItems(data.items, localItems));
      } else {
        setItems(data.items);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cache locally (instant paint, offline) on every change.
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [items, isInitialized]);

  // Push local changes to the account's saved cart (debounced).
  useEffect(() => {
    if (!isInitialized || !syncUserRef.current) return;
    if (linesKey(items) === serverKeyRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      pushTimerRef.current = null;
      const sent = itemsRef.current;
      const sentKey = linesKey(sent);
      pushInFlightRef.current = true;
      const data = await fetchCart({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: sent.map((i) => ({ variant_id: i.variant_id, qty: i.qty, fit_type: i.fit_type })) }),
      });
      pushInFlightRef.current = false;
      if (!data) return;
      if (!data.signedIn) {
        syncUserRef.current = null;
        return;
      }
      serverKeyRef.current = linesKey(data.items);
      // Adopt server-confirmed details (current prices, dropped products) unless the shopper edited meanwhile.
      if (linesKey(itemsRef.current) === sentKey) setItems(data.items);
    }, PUSH_DEBOUNCE_MS);
  }, [items, isInitialized]);

  // Pick up changes made on other devices when this tab/app comes back into view, and periodically while visible.
  useEffect(() => {
    const refresh = async () => {
      if (!syncUserRef.current || pushTimerRef.current || pushInFlightRef.current) return;
      if (document.visibilityState !== 'visible') return;
      const data = await fetchCart();
      if (!data || pushTimerRef.current || pushInFlightRef.current) return;
      if (!data.signedIn) {
        syncUserRef.current = null;
        setItems([]);
        setOwner(null);
        return;
      }
      if (data.userId !== syncUserRef.current) return;
      if (linesKey(itemsRef.current) !== serverKeyRef.current) return;
      applyServerItems(data.items);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
      clearInterval(interval);
    };
  }, [applyServerItems]);

  const setCurrency = (c: 'NGN' | 'USD' | 'GBP') => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    mutatedSinceLoadRef.current = true;
    setItems((prev) => mergeItems(prev, [{ ...newItem, id: lineId(newItem.variant_id, newItem.fit_type) }]));
    setIsCartOpen(true);
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(itemId);
      return;
    }
    mutatedSinceLoadRef.current = true;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: Math.min(MAX_LINE_QTY, Math.floor(qty)) } : i))
    );
  };

  const removeItem = (itemId: string) => {
    mutatedSinceLoadRef.current = true;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    mutatedSinceLoadRef.current = true;
    setItems([]);
  };

  const subtotalKobo = items.reduce(
    (sum, item) => sum + calculateLineTotal(item.unit_price_kobo, item.qty),
    0
  );

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

  const format = (kobo: number) => formatMoney(kobo, currency, fxRates);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotalKobo,
        totalCount,
        currency,
        setCurrency,
        fxRates,
        format,
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
