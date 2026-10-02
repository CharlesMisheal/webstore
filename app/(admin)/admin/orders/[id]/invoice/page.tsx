import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOrderById, getStoreSettings } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import { formatDate } from '@/components/admin/AdminPageHeader';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';

/** Printable invoice / receipt. Uses print CSS so "Save as PDF" from the browser gives a clean A4. */
export default async function InvoicePage({ params }: { params: { id: string } }) {
  const [order, settings] = await Promise.all([getOrderById(params.id), getStoreSettings()]);
  if (!order) notFound();
  const paid = order.payment?.status === 'success';
  const addr = order.shipping_address;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="text-xs text-text-3 hover:text-navy">← Back to order</Link>
        <PrintButton />
      </div>

      <article className="bg-white border border-stone rounded-lg p-8 sm:p-10 print:border-0 print:shadow-none print:p-0 text-sm text-text" aria-label={`Invoice ${order.order_number}`}>
        <header className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b-2 border-navy">
          <div className="flex items-start space-x-3">
            <Image src="/images/logo.png" alt="" width={56} height={56} className="rounded-full" />
            <div>
              <p className="font-serif text-xl font-bold tracking-widest text-navy uppercase">A-Plus Fashion Home</p>
              <p className="text-xs text-text-3 italic">Wear Class, Live Bold</p>
              <p className="text-xs text-text-2 mt-2 max-w-xs">{settings.contact.address}</p>
              <p className="text-xs text-text-2">{formatPhoneDisplay(settings.contact.whatsapp)} · {settings.contact.email}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-widest text-gold-dark font-semibold">{paid ? 'Receipt' : 'Invoice'}</p>
            <p className="font-mono font-bold text-navy text-lg">{order.order_number}</p>
            <p className="text-xs text-text-2">Date: {formatDate(order.placed_at)}</p>
            <p className={`text-xs font-semibold mt-1 ${paid ? 'text-aplus-success' : 'text-amber-700'}`}>{paid ? 'PAID' : `STATUS: ${order.status.toUpperCase()}`}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-gold-dark mb-1">Billed to</p>
            <p className="font-medium text-navy">{order.customer_name}</p>
            <p>{order.customer_email}</p>
            <p>{order.customer_phone}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-gold-dark mb-1">Deliver to</p>
            <p className="font-medium text-navy">{addr.fullName}</p>
            <p>{addr.address}</p>
            <p>{addr.city}, {addr.state}, {addr.country}</p>
            <p className="text-text-3 mt-1">{addr.deliveryMethod}</p>
          </div>
        </section>

        <table className="w-full text-left text-xs border-t border-stone">
          <thead>
            <tr className="text-navy font-semibold border-b border-stone">
              <th className="py-2">Description</th>
              <th className="py-2">Size / fit</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2.5 font-medium text-navy">{i.name_snapshot}</td>
                <td className="py-2.5 text-text-2">{i.size_snapshot} · {i.fit_type === 'bespoke' ? 'Made to measure' : 'Ready to wear'}</td>
                <td className="py-2.5 text-right">{formatNaira(i.unit_price_kobo)}</td>
                <td className="py-2.5 text-right">{i.qty}</td>
                <td className="py-2.5 text-right">{formatNaira(i.line_total_kobo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone">
            <tr><td colSpan={4} className="py-1.5 text-right text-text-2">Subtotal</td><td className="py-1.5 text-right">{formatNaira(order.subtotal_kobo)}</td></tr>
            <tr><td colSpan={4} className="py-1.5 text-right text-text-2">Delivery</td><td className="py-1.5 text-right">{formatNaira(order.delivery_fee_kobo)}</td></tr>
            <tr className="border-t-2 border-navy"><td colSpan={4} className="py-2 text-right font-bold text-navy text-sm">Total (NGN)</td><td className="py-2 text-right font-bold text-navy text-sm">{formatNaira(order.total_kobo)}</td></tr>
          </tfoot>
        </table>

        {order.payment && (
          <section className="mt-6 p-4 bg-ivory-2 rounded border border-stone text-xs">
            <p className="font-semibold uppercase tracking-wider text-gold-dark mb-1">Payment</p>
            <p>
              Paystack · {order.payment.channel || '—'} · Ref <span className="font-mono">{order.payment.reference}</span>
              {order.payment.paid_at && <> · {formatDate(order.payment.paid_at)}</>}
            </p>
            {order.payment.refund_status !== 'none' && <p className="text-aplus-error mt-1">Refund: {order.payment.refund_status}</p>}
          </section>
        )}

        <footer className="mt-8 pt-4 border-t border-stone text-[11px] text-text-3 text-center">
          Thank you for choosing A-Plus Fashion Home. Alterations within 14 days of delivery are complimentary — see our alteration policy online.
        </footer>
      </article>
    </div>
  );
}
