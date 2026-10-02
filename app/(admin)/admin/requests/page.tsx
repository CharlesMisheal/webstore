import React from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { getBookings, getContactMessages, getQuotes } from '@/lib/db';
import { AdminPageHeader, EmptyState } from '@/components/admin/AdminPageHeader';
import { QuoteCard, BookingCard, ContactCard } from './RequestCards';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Requests' };

type Tab = 'quotes' | 'bookings' | 'messages';

export default async function AdminRequestsPage({ searchParams }: { searchParams: { tab?: string; show?: string } }) {
  const tab: Tab = searchParams.tab === 'bookings' ? 'bookings' : searchParams.tab === 'messages' ? 'messages' : 'quotes';
  const showAll = searchParams.show === 'all';
  const [quotes, bookings, messages] = await Promise.all([getQuotes(), getBookings(), getContactMessages()]);

  const openQuotes = quotes.filter((q) => q.status === 'requested');
  const openBookings = bookings.filter((b) => b.status === 'requested');
  const openMessages = messages.filter((m) => !m.handled);

  const tabs: Array<{ id: Tab; label: string; open: number }> = [
    { id: 'quotes', label: 'Bespoke quotes', open: openQuotes.length },
    { id: 'bookings', label: 'Fittings', open: openBookings.length },
    { id: 'messages', label: 'Contact messages', open: openMessages.length },
  ];

  const visibleQuotes = showAll ? quotes : quotes.filter((q) => q.status === 'requested' || q.status === 'quote_sent');
  const visibleBookings = showAll ? bookings : bookings.filter((b) => b.status === 'requested' || b.status === 'confirmed' || b.status === 'rescheduled');
  const visibleMessages = showAll ? messages : openMessages;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Inbox"
        title="Requests"
        description="Bespoke quotations, fitting appointments and contact-form messages. Replies to quotes are emailed to the customer."
        actions={
          <Link href={`/admin/requests?tab=${tab}&show=${showAll ? 'open' : 'all'}`} className="text-xs px-3 py-2 border border-stone rounded bg-white hover:bg-ivory-2 text-navy font-medium">
            {showAll ? 'Show open only' : 'Show all (incl. closed)'}
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 text-xs" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            href={`/admin/requests?tab=${t.id}${showAll ? '&show=all' : ''}`}
            className={`px-3 py-2 rounded font-medium inline-flex items-center space-x-2 ${tab === t.id ? 'bg-navy text-ivory' : 'bg-white border border-stone text-text-2 hover:bg-ivory-2'}`}
          >
            <span>{t.label}</span>
            {t.open > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.id ? 'bg-gold text-navy' : 'bg-gold/20 text-gold-dark'}`}>{t.open}</span>}
          </Link>
        ))}
      </div>

      {tab === 'quotes' && (
        visibleQuotes.length === 0 ? (
          <div className="bg-white rounded-lg border border-stone"><EmptyState icon={Inbox} title="No open quotes" body="New bespoke requests from /quote land here." /></div>
        ) : (
          <div className="space-y-4">{visibleQuotes.map((q) => <QuoteCard key={q.id} quote={q} />)}</div>
        )
      )}

      {tab === 'bookings' && (
        visibleBookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-stone"><EmptyState icon={Inbox} title="No open fittings" body="Fitting requests from /booking land here." /></div>
        ) : (
          <div className="space-y-4">{visibleBookings.map((b) => <BookingCard key={b.id} booking={b} />)}</div>
        )
      )}

      {tab === 'messages' && (
        visibleMessages.length === 0 ? (
          <div className="bg-white rounded-lg border border-stone"><EmptyState icon={Inbox} title="Inbox zero" body="Contact-form messages land here." /></div>
        ) : (
          <div className="space-y-4">{visibleMessages.map((m) => <ContactCard key={m.id} message={m} />)}</div>
        )
      )}
    </div>
  );
}
