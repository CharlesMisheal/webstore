import React, { Suspense } from 'react';
import { CheckoutForm } from './CheckoutForm';

export const metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-text-3">Loading checkout…</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
