'use client';

import { useEffect } from 'react';
import { useCart } from './CartContext';

/** Mounted on the confirmation page only after the server has verified payment. */
export function ClearCartOnSuccess() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
