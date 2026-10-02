'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  MoreHorizontal,
  Clock,
} from 'lucide-react';

const IDLE_SECONDS = 30 * 60;
const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000;

interface AdminShellProps {
  adminEmail: string;
  children: React.ReactNode;
}

/**
 * Client chrome for the owner portal (sidebar / mobile tab bar / idle timer).
 * Authorization happens server-side in app/(admin)/admin/layout.tsx; this
 * component only mirrors the 30-minute idle timer for the UI and pings
 * /api/admin/session so the server-side timer slides with real activity.
 */
export function AdminShell({ adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(IDLE_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());
  const lastKeepaliveRef = useRef<number>(Date.now());

  const keepAlive = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session', { cache: 'no-store' });
      if (res.status === 440 || res.status === 401 || res.status === 403) {
        router.replace(`/admin/login?timeout=${res.status === 440 ? 'idle' : 'expired'}`);
      }
      lastKeepaliveRef.current = Date.now();
    } catch {
      /* network blip: keep the client timer running; the server is the source of truth */
    }
  }, [router]);

  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (Date.now() - lastKeepaliveRef.current > KEEPALIVE_INTERVAL_MS) void keepAlive();
    };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const tick = setInterval(() => {
      const idleSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, IDLE_SECONDS - idleSeconds);
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        clearInterval(tick);
        router.replace('/admin/login?timeout=idle');
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, [router, keepAlive]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isLow = secondsRemaining <= 120;

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

  const SignOutForm = ({ className, children: label }: { className: string; children: React.ReactNode }) => (
    <form action="/auth/signout" method="post">
      <input type="hidden" name="next" value="/admin/login" />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );

  const moreLinks = [
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Reviews', href: '/admin/reviews', icon: Star },
    { label: 'Store CMS', href: '/admin/content', icon: Settings },
    { label: 'Audit Trail', href: '/admin/audit-log', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-ivory flex flex-col lg:flex-row">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-navy text-ivory flex-col justify-between border-r border-gold/40 flex-shrink-0 min-h-screen sticky top-0">
        <div>
          <div className="p-6 border-b border-navy-2 flex items-center justify-between">
            <Link href="/admin" className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-widest text-ivory uppercase">A-Plus</span>
              <span className="text-[10px] tracking-widest text-gold-light uppercase font-sans">Owner Portal</span>
            </Link>
            <span className="px-2 py-0.5 text-[9px] bg-navy-2 text-gold-light border border-gold/30 rounded font-semibold">
              Admin
            </span>
          </div>

          <nav className="p-4 space-y-1 text-xs" aria-label="Admin navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
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

        <div className="p-4 border-t border-navy-2 space-y-3 text-xs">
          <div className="text-[11px] text-stone truncate" title={adminEmail}>
            Signed in as <span className="text-ivory">{adminEmail}</span>
          </div>
          <div
            className={`flex items-center justify-between bg-navy-2 p-2.5 rounded border text-[11px] text-stone ${
              isLow ? 'border-aplus-error/60' : 'border-gold/20'
            }`}
            aria-live={isLow ? 'polite' : 'off'}
          >
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-light" />
              <span>Idle timeout:</span>
            </div>
            <span className={`font-mono font-bold ${isLow ? 'text-red-300' : 'text-gold-light'}`}>{timeFormatted}</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-stone hover:text-ivory bg-navy hover:bg-navy-2 rounded transition"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <SignOutForm className="w-full flex items-center justify-between px-3 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-red-950/30 rounded transition">
            <span>Sign Out</span>
            <LogOut className="w-3.5 h-3.5" />
          </SignOutForm>
        </div>
      </aside>

      {/* 2. Main content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
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
            <Link href="/" target="_blank" className="text-stone hover:text-ivory p-1" aria-label="Open storefront">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </div>

      {/* 3. Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy border-t border-gold/40 text-ivory flex justify-around py-2 shadow-2xl" aria-label="Admin quick navigation">
        {[
          { href: '/admin', label: 'Home', icon: LayoutDashboard, exact: true },
          { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
          { href: '/admin/products', label: 'Products', icon: Package },
          { href: '/admin/requests', label: 'Requests', icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 text-[10px] ${isActive ? 'text-gold-light font-bold' : 'text-stone/70'}`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className="flex flex-col items-center py-1 text-[10px] text-stone/70 hover:text-gold-light"
          aria-haspopup="dialog"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* 4. Mobile "More" sheet */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Owner admin menu">
          <div className="fixed inset-0 bg-ink/60" onClick={() => setIsMobileMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-navy border-t-2 border-gold rounded-t-xl p-6 text-ivory space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-navy-2">
              <h3 className="font-serif text-base font-semibold text-ivory">Owner Admin Menu</h3>
              <button onClick={() => setIsMobileMoreOpen(false)} className="text-stone hover:text-ivory p-1" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMoreOpen(false)}
                    className="p-3 bg-navy-2 rounded border border-gold/20 flex items-center space-x-2.5 text-stone hover:text-ivory"
                  >
                    <Icon className="w-4 h-4 text-gold-light" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-navy-2 flex justify-between items-center text-xs">
              <Link href="/" target="_blank" className="text-gold-light underline">
                Storefront &rarr;
              </Link>
              <SignOutForm className="text-red-400 font-semibold">Sign Out</SignOutForm>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
