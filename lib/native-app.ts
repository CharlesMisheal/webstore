import { Capacitor } from '@capacitor/core';

/**
 * Return link for Google sign-in inside the Android app. Google refuses OAuth in
 * embedded WebViews, so the app signs in through an in-app browser tab and Supabase
 * sends the shopper back here. Must match the intent filter in AndroidManifest.xml
 * and be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export const APP_AUTH_CALLBACK = 'com.aplus.fashion://auth/callback';

/** True only inside the Capacitor Android shell (false on the website, including mobile browsers). */
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}
