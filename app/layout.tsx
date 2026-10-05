import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/cart/CartContext';
import { StoreSettingsProvider } from '@/components/providers/StoreSettingsProvider';
import { NativeAppLinks } from '@/components/providers/NativeAppLinks';
import { getStoreSettings } from '@/lib/db';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'A-Plus Fashion Home — Wear Class, Live Bold | Bespoke Suits & Formal Wear',
    template: '%s | A-Plus Fashion Home',
  },
  description:
    'A premium Nigerian bespoke and ready-to-wear formal wear house based in Ijebu-Ode, Ogun State. Tailoring distinction for grooms, wedding parties, and executives worldwide.',
  keywords: ['Bespoke suits Nigeria', 'Ijebu-Ode tailor', 'wedding suits Lagos', 'tuxedos Nigeria', 'men formal wear', 'ready-to-wear suits'],
  openGraph: {
    title: 'A-Plus Fashion Home — Wear Class, Live Bold',
    description: 'Bespoke and ready-to-wear tailored suits, blazers, and tuxedos from Ijebu-Ode, Nigeria.',
    type: 'website',
  },
};

/**
 * Root layout: fonts + global providers only. The storefront chrome lives in
 * app/(store)/layout.tsx and the admin chrome in app/(admin)/admin/layout.tsx.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getStoreSettings();

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-ivory text-text font-sans antialiased selection:bg-gold-light selection:text-navy">
        <StoreSettingsProvider settings={settings}>
          <CartProvider fxRates={settings.fx_rates}>{children}</CartProvider>
          <NativeAppLinks />
        </StoreSettingsProvider>
      </body>
    </html>
  );
}
