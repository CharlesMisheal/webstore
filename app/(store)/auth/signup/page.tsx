import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { getCurrentUser, safeNextPath } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create Account' };

interface SignupPageProps {
  searchParams: { next?: string; error?: string };
}

/**
 * Sign-up is Google-only (developer-note.md §3): the first successful sign-in
 * creates the profile and triggers the one-time welcome email.
 */
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const next = safeNextPath(searchParams.next);
  const user = await getCurrentUser();
  if (user) redirect(next);

  const perks = [
    'Order history and live tracking in one place',
    'Saved measurements for faster bespoke orders',
    'Quote and fitting requests linked to your account',
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block">
          <span className="font-serif text-2xl font-bold tracking-widest text-navy uppercase">A-Plus</span>
          <span className="text-[10px] tracking-[0.25em] text-gold-dark uppercase block">Fashion Home</span>
        </Link>
        <h1 className="font-serif text-2xl text-navy pt-2">Create your account</h1>
        <p className="text-xs text-text-3">One tap with Google — no forms, no passwords.</p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-stone shadow-sm space-y-6">
        <ul className="space-y-2 text-xs text-text-2">
          {perks.map((p) => (
            <li key={p} className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-aplus-success flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        {searchParams.error && (
          <div className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200" role="alert">
            Google sign-in could not be completed. Please try again.
          </div>
        )}

        <GoogleSignInButton next={next} />

        <p className="text-[11px] text-text-3 text-center">
          Already have an account?{' '}
          <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-navy font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
