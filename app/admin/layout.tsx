'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Users,
  MessageSquare,
  Star,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Menu,
  X,
  MoreHorizontal,
  Clock
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 min idle timer

  // 30-minute idle session timer per developer-note.md section 2.3
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/admin/login?timeout=true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const resetTimer = () => setSecondsRemaining(1800);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [router]);

  // Don't wrap admin login page with sidebar/bottom bar
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-ivory">{children}</div>;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const navLinks = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Quotes & Bookings', href: '/admin/requests', icon: MessageSquare },
    { label: 'Reviews', href: '/admin/reviews', icon: Star },
    { label: 'Store Content', href: '/admin/content', icon: Settings },
    { label: 'Audit Trail', href: '/admin/audit-log', icon: ShieldAlert },
  ];

  const handleAdminSignOut = () => {
    localStorage.removeItem('aplus_admin_session');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col lg:flex-row">
      {/* 1. Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:flex lg:w-64 bg-navy text-ivory flex-col justify-between border-r border-gold/40 flex-shrink-0 min-h-screen sticky top-0">
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-navy-2 flex items-center justify-between">
            <Link href="/admin" className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-widest text-ivory uppercase">
                A-Plus
              </span>
              <span className="text-[10px] tracking-widest text-gold-light uppercase font-sans">
                Owner Portal
              </span>
            </Link>
            <span className="px-2 py-0.5 text-[9px] bg-navy-2 text-gold-light border border-gold/30 rounded font-semibold">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded transition ${
                    isActive
                      ? 'bg-navy-2 text-gold-light font-semibold border-l-2 border-gold-light'
                      : 'text-ivory/80 hover:bg-navy-2 hover:text-ivory'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Session Countdown & Store Link */}
        <div className="p-4 border-t border-navy-2 space-y-3 text-xs">
          <div className="flex items-center justify-between bg-navy-2 p-2.5 rounded border border-gold/20 text-[11px] text-stone">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-light" />
              <span>Session:</span>
            </div>
            <span className="font-mono font-bold text-gold-light">{timeFormatted}</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-stone hover:text-ivory bg-navy hover:bg-navy-2 rounded transition"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleAdminSignOut}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/30 rounded transition"
          >
            <span>Sign Out</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* 2. Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Mobile Top Header */}
        <div className="lg:hidden bg-navy text-ivory p-4 border-b border-gold/30 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-base tracking-wider">A-Plus</span>
            <span className="text-[10px] text-gold-light tracking-widest uppercase">Admin</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 font-mono text-[11px] text-gold-light bg-navy-2 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3" />
              <span>{timeFormatted}</span>
            </div>
            <Link href="/" target="_blank" className="text-stone hover:text-ivory p-1">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </div>

      {/* 3. Mobile Bottom Navigation Tab Bar (Home, Orders, Products, Requests, More) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy border-t border-gold/40 text-ivory flex justify-around py-2 shadow-2xl">
        <Link
          href="/admin"
          className={`flex flex-col items-center py-1 text-[10px] ${
            pathname === '/admin' ? 'text-gold-light font-bold' : 'text-stone/70'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          href="/admin/orders"
          className={`flex flex-col items-center py-1 text-[10px] ${
            pathname.startsWith('/admin/orders') ? 'text-gold-light font-bold' : 'text-stone/70'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </Link>

        <Link
          href="/admin/products"
          className={`flex flex-col items-center py-1 text-[10px] ${
            pathname.startsWith('/admin/products') ? 'text-gold-light font-bold' : 'text-stone/70'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Products</span>
        </Link>

        <Link
          href="/admin/requests"
          className={`flex flex-col items-center py-1 text-[10px] ${
            pathname.startsWith('/admin/requests') ? 'text-gold-light font-bold' : 'text-stone/70'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span>Requests</span>
        </Link>

        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className="flex flex-col items-center py-1 text-[10px] text-stone/70 hover:text-gold-light"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>

      {/* 4. Mobile "More" Sheet Overlay */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-ink/60" onClick={() => setIsMobileMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-navy border-t-2 border-gold rounded-t-xl p-6 text-ivory space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-navy-2">
              <h3 className="font-serif text-base font-semibold text-ivory">Owner Admin Menu</h3>
              <button onClick={() => setIsMobileMoreOpen(false)} className="text-stone hover:text-ivory p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href="/admin/categories"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
              >
                <Layers className="w-4 h-4 text-gold-light" />
                <span>Categories</span>
              </Link>
              <Link
                href="/admin/payments"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
              >
                <CreditCard className="w-4 h-4 text-gold-light" />
                <span>Payments</span>
              </Link>
              <Link
                href="/admin/customers"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
              >
                <Users className="w-4 h-4 text-gold-light" />
                <span>Customers</span>
              </Link>
              <Link
                href="/admin/reviews"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
              >
                <Star className="w-4 h-4 text-gold-light" />
                <span>Reviews</span>
              </Link>
              <Link
                href="/admin/content"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
              >
                <Settings className="w-4 h-4 text-gold-light" />
                <span>Store CMS</span>
              </Link>
              <Link
                href="/admin/audit-log"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
              >
                <ShieldAlert className="w-4 h-4 text-gold-light" />
                <span>Audit Trail</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-navy-2 flex justify-between items-center text-xs">
              <Link href="/" target="_blank" className="text-gold-light underline">
                Storefront &rarr;
              </Link>
              <button onClick={handleAdminSignOut} className="text-red-400 font-semibold">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
