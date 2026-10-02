import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { getCurrentUser } from '@/lib/auth';
import { HttpError, authorizeAdminUser } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Owner Portal Login', robots: { index: false, follow: false } };

interface AdminLoginPageProps {
  searchParams: { denied?: string; timeout?: string; error?: string; next?: string };
}

/**
 * Owner portal login (wireframe 10-admin-desktop-01-login).
 * Lives outside the (admin) route group so it is not wrapped by the guard.
 * States: default, access denied (non-owner Google account), idle/absolute timeout, OAuth error.
 */
export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  // Already an authorized admin with a live session? Go straight in.
  const user = await getCurrentUser();
  if (user && !searchParams.timeout) {
    try {
      await authorizeAdminUser(user);
      if (!searchParams.denied) {
        redirect(searchParams.next?.startsWith('/admin') ? searchParams.next : '/admin');
      }
    } catch (err) {
      if (!(err instanceof HttpError)) throw err;
      // Shopper signed in with Google — owner portal is closed to them.
      redirect('/account');
    }
  }

  const deniedEmail = searchParams.denied && searchParams.denied !== '1' ? searchParams.denied : null;
  const isDenied = Boolean(searchParams.denied);
  const timeout = searchParams.timeout;
  const oauthError = searchParams.error;
  const next = searchParams.next?.startsWith('/admin') ? searchParams.next : '/admin';

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-gold overflow-hidden">
        <div className="bg-navy p-6 text-center border-b-2 border-gold text-ivory">
          <span className="font-serif text-2xl font-bold tracking-widest uppercase">A-Plus</span>
          <span className="text-[10px] tracking-widest text-gold-light uppercase block font-sans">Store Administration</span>
          <h1 className="font-serif text-lg text-ivory mt-3">Owner Portal Login</h1>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {timeout && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start space-x-2" role="status">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                {timeout === 'idle'
                  ? 'You were signed out after 30 minutes of inactivity. Please sign in again.'
                  : 'Your admin session expired. Please sign in again.'}
              </p>
            </div>
          )}

          {oauthError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-aplus-error" role="alert">
              {oauthError === 'session'
                ? 'We could not verify your session (the server may be misconfigured or Supabase unreachable). Please sign in again.'
                : `Google sign-in could not be completed (${oauthError}). Please try again.`}
            </div>
          )}

          {isDenied ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center space-y-2" role="alert">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-aplus-error flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="font-serif text-lg font-bold text-aplus-error">Access Denied</h2>
                <p className="text-xs text-text-2 leading-relaxed">
                  {deniedEmail ? (
                    <>
                      The Google account <strong>{deniedEmail}</strong> is not on the A-Plus Fashion Home owner allow-list.
                    </>
                  ) : (
                    <>Your Google account is not on the A-Plus Fashion Home owner allow-list.</>
                  )}
                </p>
                <p className="text-[11px] text-text-3">
                  This portal is reserved for the store owner. Shoppers sign in from Account to place and track orders.
                </p>
              </div>

              <Link href="/account" className="block w-full py-3 bg-navy text-ivory text-xs font-semibold rounded hover:bg-navy-2 transition text-center">
                Continue to your customer account
              </Link>
              <Link href="/auth/login" className="block text-center text-xs text-navy font-semibold hover:underline">
                Sign in as a shopper
              </Link>
              {user && (
                <form action="/auth/signout" method="post">
                  <input type="hidden" name="next" value="/admin/login" />
                  <button type="submit" className="w-full py-3 border border-stone text-navy text-xs font-semibold rounded hover:bg-ivory-2 transition">
                    Sign out and try another owner account
                  </button>
                </form>
              )}
              {!user && <GoogleSignInButton next={next} label="Try with another Google account" forceAccountPicker />}
            </div>
          ) : (
            <div className="space-y-4">
              <GoogleSignInButton next={next} label="Sign in with Google" forceAccountPicker />
              <p className="text-[11px] text-text-3 text-center flex items-center justify-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-aplus-success" aria-hidden="true" />
                <span>Google OAuth · owner allow-list · 30-minute idle timeout · audit-logged</span>
              </p>
              <p className="text-[11px] text-text-3 text-center">
                Buying a suit?{' '}
                <Link href="/auth/login" className="text-navy font-semibold hover:underline">
                  Sign in as a customer
                </Link>
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-stone text-center">
            <Link href="/" className="text-xs text-text-3 hover:text-navy underline">
              &larr; Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
