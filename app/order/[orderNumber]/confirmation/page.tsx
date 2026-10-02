import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByNumber } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { CheckCircle2, Clock, XCircle, MessageCircle, Truck } from 'lucide-react';

// This page must never change order state. Paystack redirects here after
// checkout, but the only paths allowed to mark an order paid are the server
// verify route (/transaction/verify) and the signed webhook (see developer-note.md §4).
export const dynamic = 'force-dynamic';

interface ConfirmationPageProps {
  params: {
    orderNumber: string;
  };
  searchParams: {
    reference?: string;
    demo?: string;
  };
}

export default async function OrderConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const order = await getOrderByNumber(params.orderNumber);
  if (!order) {
    notFound();
  }

  // Read-only: show whatever the server-verified state currently is.
  const reference = order.payment?.reference || searchParams.reference || '—';

  const currentStatus = order.status;
  const isSuccess = currentStatus === 'paid' || currentStatus === 'processing' || currentStatus === 'shipped' || currentStatus === 'delivered';
  const isPending = currentStatus === 'pending';
  const isFailed = currentStatus === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      {/* Status Hero Card */}
      <div className="bg-white border border-stone rounded-lg p-6 sm:p-8 text-center space-y-4 shadow-sm">
        {isSuccess && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-aplus-success flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold block">
              Payment Confirmed & Verified
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy">
              Thank You, {order.customer_name}!
            </h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto leading-relaxed">
              Your order <strong className="text-navy">{order.order_number}</strong> is confirmed. Master tailor Henry and the team have received your specifications and tailoring will commence shortly.
            </p>
          </>
        )}

        {isPending && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-aplus-warning flex items-center justify-center">
              <Clock className="w-10 h-10" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy">
              Awaiting Payment Confirmation
            </h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto leading-relaxed">
              Awaiting your transfer — we&apos;ll confirm as soon as it arrives via our Paystack gateway.
            </p>
          </>
        )}

        {isFailed && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-aplus-error flex items-center justify-center">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy">
              Payment Unsuccessful
            </h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto leading-relaxed">
              Payment didn&apos;t go through. No money was taken. You can try again or use direct bank transfer with our team on WhatsApp.
            </p>
            <Link
              href="/checkout"
              className="inline-block px-6 py-2.5 bg-navy text-ivory text-xs font-semibold rounded"
            >
              Retry Payment
            </Link>
          </>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/track?order=${order.order_number}`}
            className="px-6 py-3 bg-navy hover:bg-navy-2 text-ivory font-semibold text-xs rounded transition flex items-center space-x-2"
          >
            <Truck className="w-4 h-4 text-gold-light" />
            <span>Track Order Progress</span>
          </Link>

          <a
            href={`https://wa.me/2347071374515?text=Hello%20Henry%2C%20I%20just%20placed%20order%20${order.order_number}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-transparent hover:bg-ivory-2 text-navy border border-stone font-semibold text-xs rounded transition flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp Tailor</span>
          </a>
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="bg-white border border-stone rounded-lg p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone">
          <div>
            <h2 className="font-serif text-lg font-semibold text-navy">Order Summary</h2>
            <p className="text-xs text-text-3">Placed on {new Date(order.placed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
          </div>
          <div className="text-xs text-text-2 mt-2 sm:mt-0">
            <span>Reference: </span>
            <code className="bg-ivory-2 px-2 py-0.5 rounded text-navy font-mono">{reference}</code>
          </div>
        </div>

        {/* Items */}
        <div className="divide-y divide-stone">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-navy">{item.name_snapshot}</p>
                <p className="text-text-3">
                  Size: {item.size_snapshot} • {item.fit_type} • Qty: {item.qty}
                </p>
              </div>
              <span className="font-semibold text-navy">{formatNaira(item.line_total_kobo)}</span>
            </div>
          ))}
        </div>

        {/* Pricing Subtotal */}
        <div className="border-t border-stone pt-4 space-y-1.5 text-xs text-text-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-navy">{formatNaira(order.subtotal_kobo)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee ({order.shipping_address.deliveryMethod})</span>
            <span className="font-semibold text-navy">
              {order.delivery_fee_kobo === 0 ? 'FREE' : formatNaira(order.delivery_fee_kobo)}
            </span>
          </div>
          <div className="flex justify-between text-base font-serif font-bold text-navy pt-2 border-t border-stone">
            <span>{isSuccess ? 'Total Paid (NGN)' : 'Total Due (NGN)'}</span>
            <span>{formatNaira(order.total_kobo)}</span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-ivory-2 p-4 rounded border border-stone text-xs space-y-1">
          <h3 className="font-semibold text-navy uppercase tracking-wider text-[11px]">Delivery Address</h3>
          <p className="text-text-2">{order.shipping_address.fullName}</p>
          <p className="text-text-2">{order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state}</p>
          <p className="text-text-2">Phone: {order.shipping_address.phone}</p>
        </div>
      </div>
    </div>
  );
}
