import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { consumeRateLimit, getPaymentByReference } from '@/lib/db';
import { verifyAndSettle } from '@/lib/payments-live';
import { PaystackError } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

const schema = z.object({ reference: z.string().trim().min(6).max(100) });

/**
 * GET /api/pay/verify?reference=…
 * Called by the confirmation page (and usable by the admin "Re-verify" button).
 * Returns only what the shopper may see: order number + status. Never trusts
 * the client — we always ask Paystack directly.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await consumeRateLimit(`pay-verify:${ip}`, 30, 60 * 10))) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  const parsed = schema.safeParse({ reference: req.nextUrl.searchParams.get('reference') });
  if (!parsed.success) return NextResponse.json({ message: 'reference is required' }, { status: 400 });

  const known = await getPaymentByReference(parsed.data.reference);
  if (!known?.order) return NextResponse.json({ message: 'Unknown payment reference' }, { status: 404 });

  try {
    const outcome = await verifyAndSettle(parsed.data.reference);
    const refreshed = await getPaymentByReference(parsed.data.reference);
    return NextResponse.json({
      outcome: outcome.kind,
      order_number: known.order.order_number,
      order_status: refreshed?.order?.status ?? known.order.status,
      payment_status: refreshed?.status ?? known.status,
    });
  } catch (err) {
    if (err instanceof PaystackError) {
      return NextResponse.json({ message: err.message, order_number: known.order.order_number, order_status: known.order.status }, { status: err.status });
    }
    console.error('[pay/verify] failed:', err);
    return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
  }
}
