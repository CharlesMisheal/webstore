'use client';

import { useEffect } from 'react';
import { APP_AUTH_CALLBACK, isNativeApp } from '@/lib/native-app';

/**
 * Android app only: when Google sign-in finishes in the in-app browser tab, Supabase
 * redirects to com.aplus.fashion://auth/callback?code=...; Android hands that link back
 * to the app, and we finish sign-in on the normal /auth/callback route inside the WebView.
 */
export function NativeAppLinks() {
  useEffect(() => {
    if (!isNativeApp()) return;
    let removed = false;
    let remove: (() => void) | undefined;

    const handle = async (link: string | undefined) => {
      if (!link || !link.startsWith(APP_AUTH_CALLBACK)) return;
      const query = link.includes('?') ? link.slice(link.indexOf('?')) : '';
      const { Browser } = await import('@capacitor/browser');
      await Browser.close().catch(() => undefined);
      window.location.replace(`/auth/callback${query}`);
    };

    (async () => {
      const { App } = await import('@capacitor/app');
      const sub = await App.addListener('appUrlOpen', ({ url }) => void handle(url));
      if (removed) void sub.remove();
      else remove = () => void sub.remove();
      // App was cold-started by the link (e.g. Android killed it while the tab was open).
      const launch = await App.getLaunchUrl();
      await handle(launch?.url);
    })();

    return () => {
      removed = true;
      remove?.();
    };
  }, []);

  return null;
}
