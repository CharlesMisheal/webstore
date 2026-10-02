import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShoppingBag, Truck, LogOut, Sparkles, Calendar, MessageSquare } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getBookingsForCustomer, getOrdersForCustomer, getProfile, getQuotesForCustomer } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { MeasurementsForm } from './MeasurementsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Account' };

interface AccountPageProps {
  searchParams: { tab?: string; welcome?: string };
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/account');

  const [profile, orders, quotes, bookings] = await Promise.all([
    getProfile(user.id),
    getOrdersForCustomer(user.id, user.email),
    getQuotesForCustomer(user.email),
    getBookingsForCustomer(user.email),
  ]);

  const tab = searchParams.tab === 'measurements' || searchParams.tab === 'requests' ? searchParams.tab : 'orders';
  const displayName = profile?.full_name || user.full_name || 'Valued Customer';

  const tabs = [
    { id: 'orders', label: `My Orders (${orders.length})`, icon: ShoppingBag },
    { id: 'requests', label: `Quotes & Fittings (${quotes.length + bookings.length})`, icon: MessageSquare },
    { id: 'measurements', label: 'Saved Measurements', icon: Sparkles },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="bg-navy text-ivory p-6 sm:p-8 rounded-lg border-b-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-navy-2 border border-gold/40 flex items-center justify-center text-gold-light text-xl font-bold font-serif" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gold-light font-semibold">
              {searchParams.welcome ? 'Signed in' : 'My account'}
            </p>
            <h1 className="font-serif text-2xl text-ivory">
              {searchParams.welcome ? `Welcome, ${displayName.split(' ')[0]}` : displayName}
            </h1>
            <p className="text-xs text-stone">{user.email}</p>
            {user.email_verified && (
              <span className="inline-block mt-1 text-[10px] bg-navy-2 text-gold-light px-2 py-0.5 rounded border border-gold/30">
                Verified Google account
              </span>
            )}
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <input type="hidden" name="next" value="/" />
          <button
            type="submit"
            className="px-4 py-2 bg-navy-2 hover:bg-navy text-xs text-stone hover:text-ivory border border-gold/30 rounded flex items-center space-x-1.5 transition min-h-[44px]"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </form>
      </div>

      {/* Tabs */}
      <nav className="flex border-b border-stone space-x-6 sm:space-x-8 text-xs font-semibold overflow-x-auto" aria-label="Account sections">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.id === 'orders' ? '/account' : `/account?tab=${t.id}`}
              aria-current={active ? 'page' : undefined}
              className={`pb-3 flex items-center space-x-2 border-b-2 whitespace-nowrap transition ${
                active ? 'border-navy text-navy font-bold' : 'border-transparent text-text-3 hover:text-navy'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>

      {tab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg border border-stone space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-text-3" aria-hidden="true" />
              <h2 className="font-serif text-lg text-navy">No orders yet</h2>
              <p className="text-xs text-text-3">Orders placed with {user.email} will appear here.</p>
              <Link href="/shop" className="inline-block px-5 py-2.5 bg-navy text-ivory text-xs font-semibold rounded">
                Start shopping
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <article key={ord.id} className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
                <div className="p-4 sm:p-6 bg-ivory-2 border-b border-stone flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-text-3">Order:</span> <strong className="text-navy">{ord.order_number}</strong>
                    <span className="text-text-3 ml-3">
                      {new Date(ord.placed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <OrderStatusBadge status={ord.status} />
                    <Link
                      href={`/track?order=${ord.order_number}`}
                      className="px-3 py-1 bg-white hover:bg-stone border border-stone text-navy rounded font-medium flex items-center space-x-1"
                    >
                      <Truck className="w-3.5 h-3.5 text-gold-dark" aria-hidden="true" />
                      <span>Track</span>
                    </Link>
                  </div>
                </div>

                <div className="p-4 sm:p-6 divide-y divide-stone">
                  {ord.items.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-serif font-semibold text-navy text-sm">{item.name_snapshot}</p>
                        <p className="text-text-3 mt-0.5">
                          Size: {item.size_snapshot} • {item.fit_type === 'bespoke' ? 'Made to measure' : 'Ready to wear'} • Qty: {item.qty}
                        </p>
                      </div>
                      <span className="font-semibold text-navy">{formatNaira(item.line_total_kobo)}</span>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between items-center text-xs">
                    <span className="text-text-2">Delivery: {ord.shipping_address.deliveryMethod}</span>
                    <span className="font-bold text-navy text-sm">Total: {formatNaira(ord.total_kobo)}</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg border border-stone p-6 space-y-4">
            <h2 className="font-serif text-lg text-navy flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gold-dark" aria-hidden="true" />
              <span>Bespoke quotes</span>
            </h2>
            {quotes.length === 0 ? (
              <p className="text-xs text-text-3">
                No quote requests yet.{' '}
                <Link href="/quote" className="text-navy font-semibold hover:underline">
                  Request a bespoke quote
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-stone text-xs">
                {quotes.map((q) => (
                  <li key={q.id} className="py-3 space-y-1">
                    <div className="flex justify-between">
                      <strong className="text-navy">{q.reference}</strong>
                      <span className="uppercase text-[10px] font-semibold text-gold-dark">{q.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-text-2 line-clamp-2">
                      {q.garment} · {q.occasion}
                    </p>
                    {q.quoted_price_kobo ? (
                      <p className="text-navy font-semibold">Quoted: {formatNaira(q.quoted_price_kobo)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-lg border border-stone p-6 space-y-4">
            <h2 className="font-serif text-lg text-navy flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gold-dark" aria-hidden="true" />
              <span>Fitting appointments</span>
            </h2>
            {bookings.length === 0 ? (
              <p className="text-xs text-text-3">
                No fittings booked.{' '}
                <Link href="/booking" className="text-navy font-semibold hover:underline">
                  Book a fitting
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-stone text-xs">
                {bookings.map((b) => (
                  <li key={b.id} className="py-3 flex justify-between">
                    <div>
                      <strong className="text-navy">{b.reference}</strong>
                      <p className="text-text-2">
                        {new Date(b.starts_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                        {b.type === 'video' ? 'Video call' : 'In-shop'}
                      </p>
                    </div>
                    <span className="uppercase text-[10px] font-semibold text-gold-dark">{b.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'measurements' && (
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-stone shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-navy">Saved measurements</h2>
            <p className="text-xs text-text-3 mt-1">
              Store your measurements once for faster bespoke orders and video fittings. See the{' '}
              <Link href="/size-guide" className="text-navy font-semibold hover:underline">
                size guide
              </Link>{' '}
              for how to measure.
            </p>
          </div>
          <MeasurementsForm initial={profile?.measurements} />
        </div>
      )}
    </div>
  );
}
