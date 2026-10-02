'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulates official Google Sign-in or Supabase OAuth flow
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      // In production, calls supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })
      // For immediate local demo and testing, stores session cookie / user in localStorage
      localStorage.setItem(
        'aplus_user_session',
        JSON.stringify({
          id: 'usr_tobi_demo',
          email: 'tobi.adeleke@gmail.com',
          full_name: 'Tobi Adeleke',
          role: 'customer',
        })
      );

      setTimeout(() => {
        router.push('/account');
      }, 600);
    } catch {
      setErrorMsg('Google authentication encountered an error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block">
          <span className="font-serif text-2xl font-bold tracking-widest text-navy uppercase">
            A-Plus
          </span>
          <span className="text-[10px] tracking-[0.25em] text-gold-dark uppercase block">
            Fashion Home
          </span>
        </Link>
        <h1 className="font-serif text-2xl text-navy pt-2">Sign In to Your Account</h1>
        <p className="text-xs text-text-3">
          Access your order tracking, bespoke measurements, and quotes.
        </p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-stone shadow-sm space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Official Google Sign-in Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 rounded shadow-sm flex items-center justify-center space-x-3 transition font-medium text-xs text-neutral-700 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-1 disabled:opacity-50 touch-target"
            aria-label="Sign in with Google"
          >
            {/* Official Google 'G' Mark SVG */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>{isLoading ? 'Verifying with Google...' : 'Continue with Google'}</span>
          </button>

          <p className="text-[11px] text-text-3 text-center">
            Fast, secure single sign-on. No password to remember.
          </p>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-stone" />
          <span className="flex-shrink mx-3 text-[11px] text-text-3 uppercase">Or</span>
          <div className="flex-grow border-t border-stone" />
        </div>

        {/* Quick Demo Access Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-3 bg-ivory-2 hover:bg-stone text-navy border border-stone rounded text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>One-Click Demo Customer Account</span>
          </button>
        </div>

        <div className="pt-2 border-t border-stone flex items-center justify-between text-xs text-text-3">
          <span>Are you the store owner?</span>
          <Link href="/admin/login" className="text-gold-dark hover:underline font-semibold">
            Admin Sign-in &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
