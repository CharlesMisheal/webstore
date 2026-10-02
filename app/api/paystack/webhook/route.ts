import type { NextRequest } from 'next/server';
import { verifyPaystackSignature } from '@/lib/paystack';
import { settleFromWebhook } from '@/lib/payments-live';
import { addAuditLog, markPaymentStatus, syncRefundFromWebhook } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Paystack webhook (developer-note.md §5).
 *  - Verifies x-paystack-signature (HMAC SHA-512 over the raw body).
 *  - charge.success -> settleFromWebhook (idempotent via apply_paid_order).
 *  - charge.failed / abandoned -> payment row status only.
 *  - refund.* -> mirror refund status.
 * Always returns 200 once the signature is valid so Paystack does not retry
 * events we have deliberately ignored; processing errors return 500 to retry.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(rawBody, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  const data = (event.data ?? {}) as Record<string, unknown>;
  const reference = typeof data.reference === 'string' ? data.reference : undefined;

  try {
    switch (event.event) {
      case 'charge.success': {
        const outcome = await settleFromWebhook({
          reference: String(data.reference ?? ''),
          amount: Number(data.amount),
          currency: String(data.currency ?? ''),
          status: 'success',
          channel: typeof data.channel === 'string' ? data.channel : undefined,
          paid_at: typeof data.paid_at === 'string' ? data.paid_at : null,
          ...data,
        });
        console.info(`[webhook] charge.success ${reference}: ${outcome.kind}`);
        break;
      }
      case 'charge.failed':
      case 'charge.abandoned': {
        if (reference) await markPaymentStatus(reference, event.event === 'charge.failed' ? 'failed' : 'abandoned', data);
        break;
      }
      case 'refund.processed':
      case 'refund.failed':
      case 'refund.pending': {
        const tx = data.transaction as { reference?: string } | string | undefined;
        const txReference = typeof tx === 'object' && tx ? tx.reference : typeof data.transaction_reference === 'string' ? data.transaction_reference : undefined;
        const status = event.event.split('.')[1] as 'processed' | 'failed' | 'pending';
        if (txReference) {
          await syncRefundFromWebhook(txReference, status, data.id ? String(data.id) : undefined);
          await addAuditLog({
            actor_email: 'paystack:webhook',
            action: `refund.${status}`,
            entity: 'payments',
            entity_id: txReference,
            after: { amount_kobo: data.amount, refund_id: data.id },
          });
        }
        break;
      }
      default:
        // Unhandled event type: acknowledge so Paystack stops retrying.
        break;
    }
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error(`[webhook] ${event.event} failed:`, err);
    return new Response('Processing error', { status: 500 });
  }
}
