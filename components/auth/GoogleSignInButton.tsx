'use client';

import React, { useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { APP_AUTH_CALLBACK, isNativeApp } from '@/lib/native-app';

interface GoogleSignInButtonProps {
  /** Where to land after a successful sign-in (same-origin path). */
  next: string;
  label?: string;
  loadingLabel?: string;
  /** Google's `prompt=select_account` is useful on the admin login so the owner can switch accounts. */
  forceAccountPicker?: boolean;
  className?: string;
  onError?: (message: string) => void;
}

/**
 * Official-style Google sign-in button (Google brand guidelines: white
 * surface, 1px #747775 border, Roboto-ish sans, 'G' mark at 18px).
 * States: default, hover, focus, pressed, loading, disabled, error.
 */
export function GoogleSignInButton({
  next,
  label = 'Continue with Google',
  loadingLabel = 'Redirecting to Google…',
  forceAccountPicker = false,
  className = '',
  onError,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleClick = async () => {
    setError('');
    if (!configured) {
      const msg = 'Sign-in is not configured yet (Supabase keys missing).';
      setError(msg);
      onError?.(msg);
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabase();

      if (isNativeApp()) {
        // The PKCE verifier is stored in this WebView's cookies, so the code that comes back
        // through the app link is exchanged here, and the session belongs to the app.
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${APP_AUTH_CALLBACK}?next=${encodeURIComponent(next)}`,
            skipBrowserRedirect: true,
            queryParams: forceAccountPicker ? { prompt: 'select_account' } : undefined,
          },
        });
        if (oauthError) throw oauthError;
        if (!data?.url) throw new Error('Google sign-in could not start. Please try again.');
        const { Browser } = await import('@capacitor/browser');
        const finished = await Browser.addListener('browserFinished', () => {
          setIsLoading(false);
          void finished.remove();
        });
        await Browser.open({ url: data.url });
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: forceAccountPicker ? { prompt: 'select_account' } : undefined,
        },
      });
      if (oauthError) throw oauthError;
      // The browser is now navigating to Google; keep the loading state.
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(msg);
      onError?.(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`w-full min-h-[48px] py-3 px-4 bg-white text-[#1F1F1F] border border-[#747775] rounded flex items-center justify-center space-x-3 font-medium text-sm transition
          hover:bg-[#F7F8F8] hover:shadow-sm
          focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2
          active:bg-[#EDEEEE]
          disabled:opacity-60 disabled:cursor-wait ${className}`}
      >
        {isLoading ? (
          <span className="w-[18px] h-[18px] border-2 border-[#747775] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        ) : (
          <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
          </svg>
        )}
        <span>{isLoading ? loadingLabel : label}</span>
      </button>
      {error && (
        <p role="alert" className="text-xs text-aplus-error">
          {error}
        </p>
      )}
    </div>
  );
}
