import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { errorResponse, requireAdmin } from '@/lib/admin-guard';
import { addAuditLog, createRefund, getPaymentByReference, updatePaymentRefundStatus } from '@/lib/db';
import { createPaystackRefund, PaystackError } from '@/lib/paystack';
import { TEST_PAYMENT_CHANNEL } from '@/lib/test-orders';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reference: z.string().trim().min(6).max(100),
  /** Omit for a full refund. */
  amount_kobo: z.number().int().positive().optional(),
  reason: z.string().trim().min(3).max(300),
});

/** POST /api/admin/refund — owner-only. Creates a Paystack refund and mirrors it locally. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());

    const payment = await getPaymentByReference(body.reference);
    if (!payment || !payment.order) return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    if (payment.status !== 'success') return NextResponse.json({ message: 'Only successful payments can be refunded' }, { status: 409 });
    if (payment.channel === TEST_PAYMENT_CHANNEL) {
      return NextResponse.json({ message: 'This is a test order: no money was taken, so there is nothing to refund. Cancel the order instead.' }, { status: 409 });
    }
    if (payment.refund_status === 'full') return NextResponse.json({ message: 'This payment has already been fully refunded' }, { status: 409 });

    const amount = body.amount_kobo ?? payment.amount_kobo;
    if (amount > payment.amount_kobo) return NextResponse.json({ message: 'Refund exceeds the amount paid' }, { status: 400 });

    const refund = await createPaystackRefund({ reference: body.reference, amountKobo: body.amount_kobo, reason: body.reason });

    const isFull = amount >= payment.amount_kobo;
    await createRefund({
      payment_id: body.reference,
      amount_kobo: amount,
      reason: body.reason,
      paystack_refund_id: String(refund.id),
      status: refund.status || 'pending',
      created_by: admin.email,
    });
    await updatePaymentRefundStatus(body.reference, isFull ? 'pending' : 'partial');

    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: isFull ? 'payment.refund_full' : 'payment.refund_partial',
      entity: 'payments',
      entity_id: body.reference,
      before: { refund_status: payment.refund_status },
      after: { amount_kobo: amount, reason: body.reason, paystack_refund_id: refund.id, order_number: payment.order.order_number },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      user_agent: req.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin/payments');
    revalidatePath(`/admin/orders/${payment.order_id}`);

    return NextResponse.json({ success: true, refund_id: refund.id, status: refund.status, amount_kobo: amount });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    if (err instanceof PaystackError) return NextResponse.json({ message: err.message }, { status: err.status });
    return errorResponse(err);
  }
}
