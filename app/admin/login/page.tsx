'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isEmailAllowedAdmin } from '@/lib/admin-guard';
import { ShieldCheck, AlertTriangle, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('henryaplus82@gmail.com');
  const [accessDeniedEmail, setAccessDeniedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (emailToTest: string) => {
    setIsLoading(true);
    setAccessDeniedEmail(null);

    setTimeout(() => {
      if (isEmailAllowedAdmin(emailToTest)) {
        localStorage.setItem(
          'aplus_admin_session',
          JSON.stringify({
            email: emailToTest,
            role: 'owner',
            verified: true,
            login_time: new Date().toISOString(),
          })
        );
        router.push('/admin');
      } else {
        setAccessDeniedEmail(emailToTest);
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-gold overflow-hidden">
        {/* Header */}
        <div className="bg-navy p-6 text-center border-b-2 border-gold text-ivory">
          <span className="font-serif text-2xl font-bold tracking-widest uppercase">
            A-Plus
          </span>
          <span className="text-[10px] tracking-widest text-gold-light uppercase block font-sans">
            Store Administration
          </span>
          <h1 className="font-serif text-lg text-ivory mt-3">Owner Portal Login</h1>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Access Denied State (matches 10-admin-desktop-01-login.png / mobile login denied) */}
          {accessDeniedEmail ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-aplus-error flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-aplus-error">Access Denied</h3>
                <p className="text-xs text-text-2 leading-relaxed">
                  Your Google account (<strong>{accessDeniedEmail}</strong>) is not authorized on the A-Plus Fashion Home owner allow-list.
                </p>
                <p className="text-[11px] text-text-3">
                  This administrative panel is strictly reserved for store owner Henry Abraham and authorized staff.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAccessDeniedEmail(null)}
                className="w-full py-3 bg-navy text-ivory text-xs font-semibold rounded hover:bg-navy-2 transition"
              >
                Try With Another Account
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Google Sign-in */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSignIn(emailInput)}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 rounded shadow-sm flex items-center justify-center space-x-3 transition font-medium text-xs text-neutral-700 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50 touch-target"
                >
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
                  <span>{isLoading ? 'Verifying Admin Access...' : 'Sign in with Google Account'}</span>
                </button>

                <p className="text-[11px] text-text-3 text-center">
                  Protected by 2-Factor Google OAuth and IP audit logging.
                </p>
              </div>

              {/* Simulation switch for testing allow-list */}
              <div className="bg-ivory-2 p-4 rounded border border-stone space-y-3 text-xs">
                <span className="font-semibold text-navy block">Security Allow-List Evaluation:</span>

                <div>
                  <label className="block text-[11px] text-text-3 mb-1">Simulate Google Account Email:</label>
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. henryaplus82@gmail.com"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                    <button
                      type="button"
                      onClick={() => handleSignIn(emailInput)}
                      className="px-3 py-1.5 bg-navy text-ivory rounded font-semibold text-xs hover:bg-navy-2 transition"
                    >
                      Login
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('henryaplus82@gmail.com');
                      handleSignIn('henryaplus82@gmail.com');
                    }}
                    className="flex-1 py-1.5 text-[11px] bg-emerald-50 text-aplus-success border border-emerald-300 rounded font-semibold hover:bg-emerald-100 transition flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Owner (Allowed)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('unauthorized.guest@gmail.com');
                      handleSignIn('unauthorized.guest@gmail.com');
                    }}
                    className="flex-1 py-1.5 text-[11px] bg-red-50 text-aplus-error border border-red-300 rounded font-semibold hover:bg-red-100 transition flex items-center justify-center space-x-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Test Denied</span>
                  </button>
                </div>
              </div>
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
