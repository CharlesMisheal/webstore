'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Search, User, ShieldCheck } from 'lucide-react';
import { useCart } from '../cart/CartContext';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { totalCount, setIsCartOpen, currency, setCurrency } = useCart();

  // Hide main store navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { label: 'Suits', href: '/category/suits' },
    { label: 'Blazers', href: '/category/blazers-jackets' },
    { label: 'Tuxedos', href: '/category/tuxedos' },
    { label: 'Shirts', href: '/category/shirts' },
    { label: 'Pants', href: '/category/pants' },
    { label: 'Bespoke Quote', href: '/quote' },
    { label: 'Book Fitting', href: '/booking' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy text-ivory shadow-md border-b border-gold/40">
      {/* Top Announcement Strip */}
      <div className="bg-navy-2 text-gold-light py-1.5 px-4 text-center text-xs tracking-wider border-b border-navy font-sans flex items-center justify-center space-x-3">
        <span>Tailored in Ijebu-Ode, Nigeria</span>
        <span className="text-gold">•</span>
        <span>Delivery Across Nigeria & Worldwide</span>
        <span className="text-gold hidden sm:inline">•</span>
        <span className="hidden sm:inline">WhatsApp: +234 707 137 4515</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-ivory hover:text-gold-light rounded transition"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo & Slogan */}
          <div className="flex-1 lg:flex-initial text-center lg:text-left">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full bg-ivory/10 ring-1 ring-gold/40">
                  <Image
                    src="/images/logo.png"
                    alt="A-Plus Fashion Home logo"
                    width={48}
                    height={48}
                    priority
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div className="flex flex-col items-center lg:items-start leading-none">
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-ivory group-hover:text-gold-light transition uppercase">
                    A-Plus
                  </span>
                  <span className="text-[10px] tracking-[0.25em] text-gold-light uppercase font-sans">
                    Fashion Home
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-gold-light py-1 ${
                  pathname === link.href ? 'text-gold-light font-semibold border-b-2 border-gold-light' : 'text-ivory/90'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Currency Selector */}
            <div className="relative inline-block text-xs font-medium">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'NGN' | 'USD' | 'GBP')}
                className="bg-navy-2 border border-gold/40 text-gold-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                aria-label="Select display currency"
              >
                <option value="NGN">NGN ₦</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP £</option>
              </select>
            </div>

            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-ivory/90 hover:text-gold-light transition"
              aria-label="Toggle search bar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account / Login */}
            <Link
              href="/account"
              className="p-2 text-ivory/90 hover:text-gold-light transition hidden sm:inline-block"
              title="Customer Account"
              aria-label="Customer Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-ivory hover:text-gold-light transition flex items-center"
              aria-label={`Shopping bag with ${totalCount} items`}
            >
              <ShoppingBag className="w-6 h-6" />
              {totalCount > 0 && (
                <span className="absolute top-1 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-navy bg-gold-light rounded-full shadow">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Admin Portal Quick Link */}
            <Link
              href="/admin"
              className="hidden xl:flex items-center space-x-1 text-xs text-gold-light/80 hover:text-gold-light border border-gold/30 rounded px-2 py-1 transition"
              title="Owner Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Collapsible Search Bar */}
        {isSearchOpen && (
          <div className="py-3 border-t border-navy-2 animate-in fade-in slide-in-from-top-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search bespoke suits, tuxedos, blazers, sizes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-2 text-ivory placeholder-ivory/50 px-4 py-2.5 pl-10 rounded border border-gold/40 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                autoFocus
              />
              <Search className="w-4 h-4 text-gold-light absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-2.5 text-ivory/70 hover:text-ivory text-xs px-2 py-0.5"
              >
                Close
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-navy-2 border-t border-navy px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded hover:bg-navy transition ${
                  pathname === link.href ? 'bg-navy text-gold-light font-semibold' : 'text-ivory/90'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-navy flex flex-col space-y-2 text-sm">
            <Link
              href="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 px-3 text-ivory/90 hover:text-gold-light"
            >
              <User className="w-4 h-4 text-gold-light" />
              <span>Customer Account & Orders</span>
            </Link>
            <Link
              href="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 text-ivory/90 hover:text-gold-light"
            >
              Track an Order (APF-...)
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 text-gold-light flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Owner Admin Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
