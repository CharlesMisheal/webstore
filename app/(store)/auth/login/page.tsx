import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { getCurrentUser, safeNextPath } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign In' };

interface LoginPageProps {
  searchParams: { next?: string; error?: string };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const next = safeNextPath(searchParams.next);
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block">
          <span className="font-serif text-2xl font-bold tracking-widest text-navy uppercase">A-Plus</span>
          <span className="text-[10px] tracking-[0.25em] text-gold-dark uppercase block">Fashion Home</span>
        </Link>
        <h1 className="font-serif text-2xl text-navy pt-2">Sign in to your account</h1>
        <p className="text-xs text-text-3">Track orders, save your measurements, and manage bespoke quotes.</p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-stone shadow-sm space-y-6">
        {searchParams.error && (
          <div className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200" role="alert">
            Google sign-in could not be completed. Please try again.
          </div>
        )}

        <GoogleSignInButton next={next} />
        <p className="text-[11px] text-text-3 text-center">Fast, secure single sign-on with Google. No password to remember.</p>

        <div className="pt-4 border-t border-stone text-xs text-text-3 space-y-2">
          <p>
            New here?{' '}
            <Link href={`/auth/signup?next=${encodeURIComponent(next)}`} className="text-navy font-semibold hover:underline">
              Create an account
            </Link>{' '}
            — it uses the same Google button.
          </p>
          <p>
            You can also{' '}
            <Link href="/track" className="text-navy font-semibold hover:underline">
              track an order
            </Link>{' '}
            without signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
