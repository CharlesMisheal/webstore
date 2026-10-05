import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByNumber, getStoreSettings } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { verifyAndSettle } from '@/lib/payments-live';
import { isPaystackConfigured } from '@/lib/paystack';
import { TEST_PAYMENT_CHANNEL } from '@/lib/test-orders';
import { ClearCartOnSuccess } from '@/components/cart/ClearCartOnSuccess';
import { CheckCircle2, Clock, XCircle, MessageCircle, Truck, RefreshCw } from 'lucide-react';

/**
 * Paystack redirects here after checkout. The page itself never mutates
 * order state directly: when a ?reference is present it asks Paystack via
 * verifyAndSettle() (the same idempotent path the webhook uses), then renders
 * whatever the database now says.
 */
export const dynamic = 'force-dynamic';

interface ConfirmationPageProps {
  params: { orderNumber: string };
  searchParams: { reference?: string; trxref?: string };
}

export default async function OrderConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const reference = searchParams.reference || searchParams.trxref;
  let verifyNote: string | null = null;

  if (reference && isPaystackConfigured()) {
    try {
      const outcome = await verifyAndSettle(reference);
      if (outcome.kind === 'amount_mismatch') verifyNote = 'The amount received does not match this order. Our team has been notified and will contact you.';
      if (outcome.kind === 'currency_mismatch') verifyNote = 'This payment was not made in Naira. Our team has been notified and will contact you.';
    } catch (err) {
      console.error('[confirmation] verify failed:', err);
      verifyNote = 'We could not reach Paystack to confirm your payment just now. If you were charged, this page will update shortly — or tap "Check again".';
    }
  }

  const [order, settings] = await Promise.all([getOrderByNumber(params.orderNumber), getStoreSettings()]);
  if (!order) notFound();

  const paymentRef = order.payment?.reference || reference || '—';
  const status = order.status;
  const isSuccess = status === 'paid' || status === 'processing' || status === 'shipped' || status === 'delivered';
  const isPending = status === 'pending';
  const isCancelled = status === 'cancelled';
  const latestPayment = order.payment;
  const paymentFailed = isPending && (latestPayment?.status === 'failed' || latestPayment?.status === 'abandoned');
  const isTestOrder = latestPayment?.channel === TEST_PAYMENT_CHANNEL;

  const whatsappHref = whatsappUrl(settings.contact.whatsapp, `Hello A-Plus, I just placed order ${order.order_number}.`);
  const checkAgainHref = `/order/${order.order_number}/confirmation${latestPayment?.reference ? `?reference=${encodeURIComponent(latestPayment.reference)}` : ''}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      {isSuccess && <ClearCartOnSuccess />}

      <div className="bg-white border border-stone rounded-lg p-6 sm:p-8 text-center space-y-4 shadow-sm" aria-live="polite">
        {isSuccess && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-aplus-success flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
            </div>
            <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold block">
              {isTestOrder ? 'Test order confirmed · no payment taken' : 'Payment confirmed'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy">Thank you, {order.customer_name}!</h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto leading-relaxed">
              Your order <strong className="text-navy">{order.order_number}</strong> is confirmed. A receipt has been sent to{' '}
              <strong className="text-navy">{order.customer_email}</strong>. Our tailors are on it.
            </p>
          </>
        )}

        {isPending && !paymentFailed && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-aplus-warning flex items-center justify-center">
              <Clock className="w-10 h-10" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy">Awaiting payment confirmation</h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto leading-relaxed">
              {verifyNote || 'If you paid by bank transfer or USSD, Paystack can take a minute to confirm. This page updates automatically — no money is lost.'}
            </p>
            <Link href={checkAgainHref} className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-navy border border-stone rounded hover:bg-ivory-2">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Check again</span>
            </Link>
          </>
        )}

        {(paymentFailed || isCancelled) && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-aplus-error flex items-center justify-center">
              <XCircle className="w-10 h-10" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-navy">{isCancelled ? 'Order cancelled' : 'Payment unsuccessful'}</h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto leading-relaxed">
              {isCancelled
                ? order.cancel_reason || 'This order was cancelled. If you were charged, a refund is on its way.'
                : "Payment didn't go through and no money was taken. Your bag is still saved — you can try again or pay by bank transfer via WhatsApp."}
            </p>
            {!isCancelled && (
              <Link href="/checkout" className="inline-block px-6 py-2.5 bg-navy text-ivory text-xs font-semibold rounded">
                Try again
              </Link>
            )}
          </>
        )}

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link href={`/track?order=${order.order_number}`} className="px-6 py-3 bg-navy hover:bg-navy-2 text-ivory font-semibold text-xs rounded transition flex items-center space-x-2">
            <Truck className="w-4 h-4 text-gold-light" aria-hidden="true" />
            <span>Track order</span>
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-transparent hover:bg-ivory-2 text-navy border border-stone font-semibold text-xs rounded transition flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden="true" />
            <span>WhatsApp us</span>
          </a>
        </div>
      </div>

      <div className="bg-white border border-stone rounded-lg p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone">
          <div>
            <h2 className="font-serif text-lg font-semibold text-navy">Order summary</h2>
            <p className="text-xs text-text-3">Placed {new Date(order.placed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
          </div>
          <div className="text-xs text-text-2 mt-2 sm:mt-0">
            <span>Payment ref: </span>
            <code className="bg-ivory-2 px-2 py-0.5 rounded text-navy font-mono">{paymentRef}</code>
          </div>
        </div>

        <ul className="divide-y divide-stone">
          {order.items.map((item) => (
            <li key={item.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-navy">{item.name_snapshot}</p>
                <p className="text-text-3">
                  Size {item.size_snapshot} · {item.fit_type === 'bespoke' ? 'Made to measure' : 'Ready to wear'} · Qty {item.qty}
                </p>
              </div>
              <span className="font-semibold text-navy">{formatNaira(item.line_total_kobo)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-stone pt-4 space-y-1.5 text-xs text-text-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-navy">{formatNaira(order.subtotal_kobo)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery · {order.shipping_address.deliveryMethod}</span>
            <span className="font-semibold text-navy">{order.delivery_fee_kobo === 0 ? 'FREE' : formatNaira(order.delivery_fee_kobo)}</span>
          </div>
          <div className="flex justify-between text-base font-serif font-bold text-navy pt-2 border-t border-stone">
            <span>{isTestOrder ? 'Total (test order, not charged)' : isSuccess ? 'Total paid (NGN)' : 'Total due (NGN)'}</span>
            <span>{formatNaira(order.total_kobo)}</span>
          </div>
        </div>

        <div className="bg-ivory-2 p-4 rounded border border-stone text-xs space-y-1">
          <h3 className="font-semibold text-navy uppercase tracking-wider text-[11px]">Deliver to</h3>
          <p className="text-text-2">{order.shipping_address.fullName}</p>
          <p className="text-text-2">
            {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state}, {order.shipping_address.country}
          </p>
          <p className="text-text-2">Phone: {order.shipping_address.phone}</p>
        </div>
      </div>
    </div>
  );
}
