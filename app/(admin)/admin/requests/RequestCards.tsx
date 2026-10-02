'use client';

import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, CalendarClock, Video, Store } from 'lucide-react';
import type { Booking, ContactMessage, Quote } from '@/lib/types';
import { formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { formatDate, formatDateTime } from '@/components/admin/AdminPageHeader';
import { markContactHandledAction, replyQuoteAction, updateBookingAction, updateQuoteStatusAction } from '@/app/(admin)/admin/actions';

const statusClass: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  quote_sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rescheduled: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-stone text-text-3',
};

function StatusPill({ status }: { status: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusClass[status] ?? 'bg-ivory-2 text-text-3'}`}>{status.replace('_', ' ')}</span>;
}

function ContactLinks({ name, email, phone, reference }: { name: string; email: string; phone?: string; reference: string }) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px]">
      {phone && (
        <a href={whatsappUrl(phone, `Hello ${name}, this is A-Plus Fashion Home about your request ${reference}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 font-medium">
          <MessageCircle className="w-3 h-3" aria-hidden="true" /><span>WhatsApp</span>
        </a>
      )}
      <a href={`mailto:${email}?subject=${encodeURIComponent(`A-Plus Fashion Home — ${reference}`)}`} className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-ivory-2 text-navy hover:bg-stone font-medium">
        <Mail className="w-3 h-3" aria-hidden="true" /><span>{email}</span>
      </a>
      {phone && (
        <a href={`tel:${phone}`} className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-ivory-2 text-navy hover:bg-stone font-medium">
          <Phone className="w-3 h-3" aria-hidden="true" /><span>{phone}</span>
        </a>
      )}
    </div>
  );
}

export function QuoteCard({ quote }: { quote: Quote }) {
  const [replying, setReplying] = useState(false);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <article className="bg-white rounded-lg border border-stone p-4 space-y-3 text-xs">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-navy">{quote.reference}</span>
            <StatusPill status={quote.status} />
          </div>
          <p className="font-serif text-base text-navy mt-1">{quote.garment} <span className="text-text-3 font-sans text-xs">for</span> {quote.occasion}</p>
          <p className="text-text-3">{quote.customer_name} · requested {formatDateTime(quote.created_at)} · prefers {quote.contact_preference}</p>
        </div>
        <div className="text-right text-text-2">
          {quote.event_date && <p>Event: <strong className="text-navy">{formatDate(quote.event_date)}</strong></p>}
          {(quote.budget_min_kobo || quote.budget_max_kobo) && (
            <p>Budget: {quote.budget_min_kobo ? formatNaira(quote.budget_min_kobo) : '—'} – {quote.budget_max_kobo ? formatNaira(quote.budget_max_kobo) : '—'}</p>
          )}
        </div>
      </header>

      {quote.notes && <p className="p-3 bg-ivory-2 rounded text-text-2 whitespace-pre-line">{quote.notes}</p>}
      {quote.photo_paths.length > 0 && <p className="text-text-3">{quote.photo_paths.length} reference photo(s) attached.</p>}

      <ContactLinks name={quote.customer_name} email={quote.customer_email} phone={quote.customer_phone} reference={quote.reference} />

      {quote.status === 'quote_sent' && quote.quoted_price_kobo != null && (
        <div className="p-3 border border-gold/40 bg-gold/5 rounded">
          <p className="font-semibold text-navy">Quoted {formatNaira(quote.quoted_price_kobo)} · ready by {formatDate(quote.ready_by)}</p>
          {quote.owner_message && <p className="text-text-2 mt-1 whitespace-pre-line">{quote.owner_message}</p>}
          {quote.reply_sent_at && <p className="text-text-3 mt-1">Sent {formatDateTime(quote.reply_sent_at)}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {(quote.status === 'requested' || quote.status === 'quote_sent') && !replying && (
          <button type="button" onClick={() => setReplying(true)} className="px-3 py-2 bg-navy hover:bg-navy-2 text-ivory font-semibold rounded">
            {quote.status === 'requested' ? 'Send quotation' : 'Revise quotation'}
          </button>
        )}
        {quote.status === 'quote_sent' && (
          <>
            <ActionForm action={updateQuoteStatusAction} hideResult>
              <input type="hidden" name="quote_id" value={quote.id} />
              <input type="hidden" name="status" value="accepted" />
              <SubmitButton className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded">Mark accepted</SubmitButton>
            </ActionForm>
            <ActionForm action={updateQuoteStatusAction} hideResult confirmMessage="Mark this quote as rejected?">
              <input type="hidden" name="quote_id" value={quote.id} />
              <input type="hidden" name="status" value="rejected" />
              <SubmitButton className="px-3 py-2 border border-stone text-text-2 hover:bg-ivory-2 rounded">Mark rejected</SubmitButton>
            </ActionForm>
          </>
        )}
        {quote.status === 'requested' && (
          <ActionForm action={updateQuoteStatusAction} hideResult confirmMessage="Decline this request without a quotation?">
            <input type="hidden" name="quote_id" value={quote.id} />
            <input type="hidden" name="status" value="rejected" />
            <SubmitButton className="px-3 py-2 border border-stone text-text-2 hover:bg-ivory-2 rounded">Decline</SubmitButton>
          </ActionForm>
        )}
      </div>

      {replying && (
        <ActionForm action={replyQuoteAction} className="border-t border-stone pt-3 space-y-3" onSuccess={() => setReplying(false)}>
          <input type="hidden" name="quote_id" value={quote.id} />
          <input type="hidden" name="reference" value={quote.reference} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`price-${quote.id}`} className="block font-medium text-navy mb-1">Quoted price (₦)</label>
              <input id={`price-${quote.id}`} name="quoted_price_naira" type="number" min={1000} step="500" required defaultValue={quote.quoted_price_kobo ? quote.quoted_price_kobo / 100 : ''} className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" />
            </div>
            <div>
              <label htmlFor={`ready-${quote.id}`} className="block font-medium text-navy mb-1">Ready by</label>
              <input id={`ready-${quote.id}`} name="ready_by" type="date" min={tomorrow} required defaultValue={quote.ready_by?.slice(0, 10) ?? ''} className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" />
            </div>
          </div>
          <div>
            <label htmlFor={`msg-${quote.id}`} className="block font-medium text-navy mb-1">Message to customer</label>
            <textarea
              id={`msg-${quote.id}`}
              name="owner_message"
              rows={4}
              required
              minLength={10}
              defaultValue={quote.owner_message ?? `Dear ${quote.customer_name},\n\nThank you for choosing A-Plus Fashion Home for your ${quote.garment}. The quoted price covers fabric, tailoring and one complimentary fitting. A 50% deposit confirms your slot.\n\nWarm regards,\nHenry`}
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded"
            />
          </div>
          <div className="flex gap-2">
            <SubmitButton pendingLabel="Sending…" className="px-4 py-2 bg-gold hover:bg-gold-dark text-navy font-semibold rounded">Send quotation email</SubmitButton>
            <button type="button" onClick={() => setReplying(false)} className="px-3 py-2 border border-stone rounded text-text-2">Cancel</button>
          </div>
        </ActionForm>
      )}
    </article>
  );
}

export function BookingCard({ booking }: { booking: Booking }) {
  const [rescheduling, setRescheduling] = useState(false);
  const Icon = booking.type === 'video' ? Video : Store;
  const localValue = new Date(booking.starts_at);
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultLocal = `${localValue.getFullYear()}-${pad(localValue.getMonth() + 1)}-${pad(localValue.getDate())}T${pad(localValue.getHours())}:${pad(localValue.getMinutes())}`;
  const isPast = localValue.getTime() < Date.now();

  return (
    <article className="bg-white rounded-lg border border-stone p-4 space-y-3 text-xs">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-navy">{booking.reference}</span>
            <StatusPill status={booking.status} />
            {isPast && booking.status !== 'cancelled' && booking.status !== 'rejected' && <span className="text-[10px] text-text-3 uppercase">past</span>}
          </div>
          <p className="font-serif text-base text-navy mt-1 inline-flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gold-dark" aria-hidden="true" />
            <span>{booking.type === 'video' ? 'Video consultation' : 'In-shop fitting'}</span>
          </p>
          <p className="text-text-3">{booking.customer_name} · requested {formatDateTime(booking.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="inline-flex items-center space-x-1 text-navy font-semibold"><CalendarClock className="w-3.5 h-3.5" aria-hidden="true" /><span>{formatDateTime(booking.starts_at)}</span></p>
        </div>
      </header>

      {booking.notes && <p className="p-3 bg-ivory-2 rounded text-text-2 whitespace-pre-line">{booking.notes}</p>}
      <ContactLinks name={booking.customer_name} email={booking.customer_email} phone={booking.customer_phone} reference={booking.reference} />

      {(booking.status === 'requested' || booking.status === 'rescheduled' || booking.status === 'confirmed') && (
        <div className="flex flex-wrap gap-2 pt-1">
          {booking.status !== 'confirmed' && (
            <ActionForm action={updateBookingAction} hideResult>
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="status" value="confirmed" />
              <SubmitButton className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded">Confirm</SubmitButton>
            </ActionForm>
          )}
          {!rescheduling && (
            <button type="button" onClick={() => setRescheduling(true)} className="px-3 py-2 bg-navy hover:bg-navy-2 text-ivory font-semibold rounded">Reschedule…</button>
          )}
          {booking.status === 'requested' ? (
            <ActionForm action={updateBookingAction} hideResult confirmMessage="Reject this fitting request?">
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="status" value="rejected" />
              <SubmitButton className="px-3 py-2 border border-stone text-text-2 hover:bg-ivory-2 rounded">Reject</SubmitButton>
            </ActionForm>
          ) : (
            <ActionForm action={updateBookingAction} hideResult confirmMessage="Cancel this confirmed fitting?">
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="status" value="cancelled" />
              <SubmitButton className="px-3 py-2 border border-stone text-text-2 hover:bg-ivory-2 rounded">Cancel fitting</SubmitButton>
            </ActionForm>
          )}
        </div>
      )}

      {rescheduling && (
        <ActionForm action={updateBookingAction} className="border-t border-stone pt-3 flex flex-wrap items-end gap-3" onSuccess={() => setRescheduling(false)}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <input type="hidden" name="status" value="rescheduled" />
          <div>
            <label htmlFor={`when-${booking.id}`} className="block font-medium text-navy mb-1">New date & time</label>
            <input id={`when-${booking.id}`} name="new_starts_at" type="datetime-local" required defaultValue={defaultLocal} className="px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" />
          </div>
          <SubmitButton pendingLabel="Saving…" className="px-4 py-2 bg-navy text-ivory font-semibold rounded">Save new time</SubmitButton>
          <button type="button" onClick={() => setRescheduling(false)} className="px-3 py-2 border border-stone rounded text-text-2">Cancel</button>
          <p className="w-full text-text-3">Tell the customer the new time via WhatsApp — rescheduling does not send an email.</p>
        </ActionForm>
      )}
    </article>
  );
}

export function ContactCard({ message }: { message: ContactMessage }) {
  return (
    <article className={`bg-white rounded-lg border p-4 space-y-3 text-xs ${message.handled ? 'border-stone opacity-75' : 'border-gold/50'}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-base text-navy">{message.name}</p>
          <p className="text-text-3">{formatDateTime(message.created_at)}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${message.handled ? 'bg-stone text-text-3' : 'bg-amber-100 text-amber-800'}`}>{message.handled ? 'Handled' : 'New'}</span>
      </header>
      <p className="p-3 bg-ivory-2 rounded text-text-2 whitespace-pre-line">{message.message}</p>
      <ContactLinks name={message.name} email={message.email} phone={message.phone} reference="your message" />
      <ActionForm action={markContactHandledAction} hideResult>
        <input type="hidden" name="id" value={message.id} />
        <input type="hidden" name="handled" value={message.handled ? 'false' : 'true'} />
        <SubmitButton className={`px-3 py-2 rounded font-semibold ${message.handled ? 'border border-stone text-text-2 hover:bg-ivory-2' : 'bg-navy hover:bg-navy-2 text-ivory'}`}>
          {message.handled ? 'Reopen' : 'Mark handled'}
        </SubmitButton>
      </ActionForm>
    </article>
  );
}
