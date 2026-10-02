import { NextResponse } from 'next/server';
import { verifyPaystackSignature } from '@/lib/paystack';
import { getOrderByNumber, recordPaymentSuccess } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { addAuditLog } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Verify HMAC SHA512 signature
    const isValid = verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      return new Response('Invalid webhook signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const data = event.data;
      const orderNumber = data.metadata?.order_number;
      const amountKobo = data.amount;
      const reference = data.reference;
      const channel = data.channel || 'card';

      if (orderNumber) {
        const order = await getOrderByNumber(orderNumber);
        if (order) {
          // Idempotency check: if order is already paid, do not re-process or re-send email
          if (order.status !== 'paid') {
            // Verify amount
            if (amountKobo >= order.total_kobo) {
              await recordPaymentSuccess(orderNumber, reference, channel, amountKobo);
              order.status = 'paid';
              await sendOrderConfirmationEmail(order);
            } else {
              console.error(`Amount mismatch: expected ${order.total_kobo} kobo, got ${amountKobo}`);
            }
          }
        }
      }
    } else if (event.event === 'refund.processed') {
      addAuditLog({
        actor_email: 'paystack_webhook',
        action: 'refund.processed',
        entity: 'payments',
        entity_id: event.data?.reference,
        after: event.data,
      });
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Paystack webhook processing error:', err);
    return new Response('Error', { status: 500 });
  }
}
