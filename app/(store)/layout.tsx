import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { getCategories } from '@/lib/db';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <>
      {/* Skip link for keyboard and screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-navy focus:text-ivory rounded"
      >
        Skip to main content
      </a>

      <Navbar categories={categories} />
      <CartDrawer />
      <WhatsAppButton />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer categories={categories} />
    </>
  );
}
