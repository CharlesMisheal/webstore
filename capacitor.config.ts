import type { CapacitorConfig } from '@capacitor/cli';

const SITE = 'shopclothesonline.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.aplus.fashion',
  appName: 'A-Plus Fashion',
  webDir: 'public',

  // The app is a native shell around the live Next.js deployment. Nothing is
  // bundled: every page, API route and Supabase call happens server-side, so
  // the app and the website can never drift out of sync.
  server: {
    url: `https://${SITE}`,
    androidScheme: 'https',
    cleartext: false, // never fall back to http://
    // Paystack's hosted checkout stays inside the app. Anything else (WhatsApp,
    // Google sign-in) opens outside the WebView, which is what Google requires.
    allowNavigation: [SITE, 'checkout.paystack.com', '*.paystack.com', '*.paystack.co'],
  },

  // middleware.ts reads this to keep /admin out of the app.
  appendUserAgent: 'APlusFashionApp',

  android: {
    // Keep the WebView origin https so Supabase's secure cookies are stored.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false, // flip to true locally when debugging
  },
};

export default config;