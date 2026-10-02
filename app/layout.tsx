import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/cart/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

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
  title: 'A-Plus Fashion Home — Wear Class, Live Bold | Bespoke Suits & Formal Wear',
  description: 'A premium Nigerian bespoke and ready-to-wear formal wear house based in Ijebu-Ode, Ogun State. Tailoring distinction for grooms, wedding parties, and executives worldwide.',
  keywords: ['Bespoke suits Nigeria', 'Ijebu-Ode tailor', 'wedding suits Lagos', 'tuxedos Nigeria', 'men formal wear', 'ready-to-wear suits'],
  openGraph: {
    title: 'A-Plus Fashion Home — Wear Class, Live Bold',
    description: 'Bespoke and ready-to-wear tailored suits, blazers, and tuxedos from Ijebu-Ode, Nigeria.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-ivory text-text font-sans antialiased selection:bg-gold-light selection:text-navy">
        <CartProvider>
          {/* Skip link for screen reader accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-navy focus:text-ivory rounded"
          >
            Skip to main content
          </a>

          <Navbar />
          <CartDrawer />
          <WhatsAppButton />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
