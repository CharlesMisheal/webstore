'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CartItem, DisplayCurrency } from '@/lib/types';
import { calculateLineTotal, DEFAULT_FX_RATES, formatMoney } from '@/lib/money';
import { applyOps, CartOp, lineId, MAX_LINE_QTY, mergeItems, toWireOp } from '@/lib/cart-ops';

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
const PUSH_DEBOUNCE_MS = 400;
const REFRESH_INTERVAL_MS = 30_000;

type CartResponse =
  | { signedIn: false }
  | { signedIn: true; userId: string; items: CartItem[] }
  /** Server refused the changes as invalid; retrying would never succeed. */
  | { rejected: true };

async function callCartApi(init?: RequestInit): Promise<CartResponse | null> {
  try {
    const res = await fetch('/api/cart', { cache: 'no-store', credentials: 'same-origin', ...init });
    if (res.status === 401) return { signedIn: false };
    if (res.status === 400) return { rejected: true };
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
  /** Signed-in user whose saved cart we sync with; null = guest (local only). */
  const syncUserRef = useRef<string | null>(null);
  /** False until the first GET /api/cart settles; changes made before then are queued and reconciled. */
  const loadedRef = useRef(false);
  /** Changes not yet confirmed by the server. */
  const queueRef = useRef<CartOp[]>([]);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const setOwner = (userId: string | null) => {
    try {
      if (userId) localStorage.setItem(CART_OWNER_STORAGE_KEY, userId);
      else localStorage.removeItem(CART_OWNER_STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const signedOut = useCallback(() => {
    syncUserRef.current = null;
    queueRef.current = [];
    setItems([]);
    setOwner(null);
  }, []);

  /** Sends queued changes. `urgent` skips the debounce and uses keepalive so it survives the page closing. */
  const flush = useCallback(
    async (urgent = false) => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
      }
      if (!syncUserRef.current || inFlightRef.current || queueRef.current.length === 0) return;

      const batch = queueRef.current.slice(0, 100);
      queueRef.current = queueRef.current.slice(batch.length);
      inFlightRef.current = true;
      const data = await callCartApi({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ops: batch.map(toWireOp) }),
        keepalive: urgent,
      });
      inFlightRef.current = false;

      if (!data) {
        // Keep the changes and retry on the next change, focus or refresh tick.
        queueRef.current = [...batch, ...queueRef.current];
        return;
      }
      // Dropped; the next focus/refresh tick resyncs the bag from the server.
      if ('rejected' in data) return;
      if (!data.signedIn) {
        signedOut();
        return;
      }
      setItems(applyOps(data.items, queueRef.current));
      if (queueRef.current.length > 0) void flush();
    },
    [signedOut]
  );

  const record = useCallback(
    (op: CartOp, urgent = false) => {
      setItems((prev) => applyOps(prev, [op]));
      if (loadedRef.current && !syncUserRef.current) return;
      queueRef.current.push(op);
      if (!loadedRef.current) return;
      if (urgent) {
        void flush(true);
        return;
      }
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(() => void flush(), PUSH_DEBOUNCE_MS);
    },
    [flush]
  );

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
      const data = await callCartApi();
      if (cancelled) return;
      loadedRef.current = true;

      if (!data || 'rejected' in data) {
        // Server unreachable: behave as a local-only cart for this page view.
        queueRef.current = [];
        return;
      }
      if (!data.signedIn) {
        syncUserRef.current = null;
        queueRef.current = [];
        // Signed out since this cart was cached: don't leave the account's bag on this device.
        if (owner) signedOut();
        return;
      }

      syncUserRef.current = data.userId;
      setOwner(data.userId);

      if (owner === data.userId) {
        // Cached copy of this account's bag: the server is the truth, plus anything changed while loading.
      } else if (!owner) {
        // Guest bag from before sign-in (including changes made while loading): fold it into the saved bag.
        queueRef.current = itemsRef.current.map((item) => ({ type: 'add', item }));
      } else {
        // Another account's bag on a shared device: discard it.
        queueRef.current = [];
      }
      setItems(applyOps(data.items, queueRef.current));
      void flush();
    })();

    return () => {
      cancelled = true;
    };
  }, [flush, signedOut]);

  // Cache locally (instant paint, offline) on every change.
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [items, isInitialized]);

  // Leaving/backgrounding: send pending changes now. Returning: pick up changes made on other devices.
  useEffect(() => {
    const refresh = async () => {
      if (!syncUserRef.current || document.visibilityState !== 'visible') return;
      if (queueRef.current.length > 0) {
        void flush();
        return;
      }
      if (inFlightRef.current) return;
      const data = await callCartApi();
      if (!data || 'rejected' in data || queueRef.current.length > 0 || inFlightRef.current) return;
      if (!data.signedIn) {
        signedOut();
        return;
      }
      if (data.userId === syncUserRef.current) setItems(data.items);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void flush(true);
      else void refresh();
    };
    const onPageHide = () => void flush(true);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('focus', refresh);
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('focus', refresh);
      clearInterval(interval);
    };
  }, [flush, signedOut]);

  const setCurrency = (c: 'NGN' | 'USD' | 'GBP') => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    record({ type: 'add', item: { ...newItem, id: lineId(newItem.variant_id, newItem.fit_type) } });
    setIsCartOpen(true);
  };

  const updateQty = (itemId: string, qty: number) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item) return;
    if (qty <= 0) {
      removeItem(itemId);
      return;
    }
    record({ type: 'set', variant_id: item.variant_id, fit_type: item.fit_type, qty: Math.min(MAX_LINE_QTY, Math.floor(qty)) });
  };

  const removeItem = (itemId: string) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item) return;
    record({ type: 'remove', variant_id: item.variant_id, fit_type: item.fit_type });
  };

  /** Sent immediately (not debounced) so it survives the shopper leaving right after checkout. */
  const clearCart = () => {
    record({ type: 'clear' }, true);
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
