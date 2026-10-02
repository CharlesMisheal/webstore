import React, { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { CheckoutForm } from './CheckoutForm';

export const metadata = { title: 'Checkout', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-text-3">Loading checkout…</div>}>
      <CheckoutForm signedInEmail={user?.email} signedInName={user?.full_name} />
    </Suspense>
  );
}
