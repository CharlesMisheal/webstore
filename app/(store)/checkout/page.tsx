import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isTestCheckout } from '@/lib/test-orders';
import { CheckoutForm } from './CheckoutForm';

export const metadata = { title: 'Checkout', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: { del?: string } }) {
  const user = await getCurrentUser();
  const next = searchParams.del ? `/checkout?del=${encodeURIComponent(searchParams.del)}` : '/checkout';
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-text-3">Loading checkout…</div>}>
      <CheckoutForm signedInEmail={user.email} signedInName={user.full_name} testMode={isTestCheckout(user.email)} />
    </Suspense>
  );
}
