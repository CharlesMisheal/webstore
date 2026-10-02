import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  addAuditLog,
  consumeRateLimit,
  createOrder,
  createPaymentAttempt,
  getStoreSettings,
  getVariantsByIds,
  orderNumberExists,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { buildOrderDraft, CheckoutError, newPaymentReference } from '@/lib/checkout';
import { initializePaystackTransaction, isPaystackConfigured, PaystackError } from '@/lib/paystack';
import { generateOrderNumber } from '@/lib/money';

export const dynamic = 'force-dynamic';

/**
 * The client sends ONLY identifiers and quantities. Prices, delivery fee,
 * stock and totals are recomputed here from the database (aplus-agent.md §6).
 */
const schema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(32),
  }),
  shipping: z.object({
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    deliveryOptionId: z.string().trim().min(1).max(64),
    deliveryNotes: z.string().trim().max(500).optional(),
  }),
  items: z
    .array(
      z.object({
        variant_id: z.string().trim().min(1).max(64),
        qty: z.number().int().min(1).max(20),
        fit_type: z.enum(['ready_to_wear', 'bespoke']),
      })
    )
    .min(1)
    .max(30),
});

async function uniqueOrderNumber(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateOrderNumber();
    if (!(await orderNumberExists(candidate))) return candidate;
  }
  throw new Error('Could not allocate a unique order number');
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await consumeRateLimit(`pay-init:${ip}`, 10, 60 * 10))) {
    return NextResponse.json({ message: 'Too many checkout attempts. Please wait a few minutes and try again.' }, { status: 429 });
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { message: 'Online payment is temporarily unavailable. Please order via WhatsApp and we will confirm by bank transfer.', code: 'PAYSTACK_UNCONFIGURED' },
      { status: 503 }
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (err) {
    const issue = err instanceof z.ZodError ? err.issues[0] : null;
    return NextResponse.json({ message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request' }, { status: 400 });
  }

  try {
    const [settings, variants, user] = await Promise.all([
      getStoreSettings(),
      getVariantsByIds(Array.from(new Set(body.items.map((i) => i.variant_id)))),
      getCurrentUser(),
    ]);

    const draft = buildOrderDraft({
      lines: body.items,
      variants,
      deliveryRules: settings.delivery_rules,
      deliveryOptionId: body.shipping.deliveryOptionId,
    });

    const orderNumber = await uniqueOrderNumber();
    const order = await createOrder({
      order_number: orderNumber,
      user_id: user?.id ?? null,
      customer_name: body.customer.fullName,
      customer_email: body.customer.email.toLowerCase(),
      customer_phone: body.customer.phone,
      subtotal_kobo: draft.subtotal_kobo,
      delivery_fee_kobo: draft.delivery_fee_kobo,
      total_kobo: draft.total_kobo,
      shipping_address: {
        fullName: body.customer.fullName,
        email: body.customer.email.toLowerCase(),
        phone: body.customer.phone,
        address: body.shipping.address,
        city: body.shipping.city,
        state: body.shipping.state,
        country: body.shipping.country,
        deliveryOptionId: draft.delivery_rule.id,
        deliveryMethod: draft.delivery_rule.label,
        deliveryNotes: body.shipping.deliveryNotes,
      },
      items: draft.items,
    });

    const reference = newPaymentReference(order.order_number);
    await createPaymentAttempt(order.id, reference, order.total_kobo);

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '');
    const callbackUrl = `${siteUrl}/order/${order.order_number}/confirmation`;

    const init = await initializePaystackTransaction({
      email: order.customer_email,
      amountKobo: order.total_kobo,
      reference,
      callbackUrl,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        custom_fields: [{ display_name: 'Order', variable_name: 'order_number', value: order.order_number }],
      },
    });

    await addAuditLog({
      actor_email: order.customer_email,
      action: 'order.created',
      entity: 'orders',
      entity_id: order.id,
      after: { order_number: order.order_number, total_kobo: order.total_kobo, reference },
      ip,
    });

    return NextResponse.json({
      success: true,
      authorization_url: init.authorization_url,
      reference,
      order_number: order.order_number,
      total_kobo: order.total_kobo,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ message: err.message, code: err.code, details: err.details }, { status: 409 });
    }
    if (err instanceof PaystackError) {
      console.error('[pay/initialize] Paystack error:', err.message);
      return NextResponse.json({ message: 'We could not start the payment. Please try again or order via WhatsApp.' }, { status: err.status });
    }
    console.error('[pay/initialize] failed:', err);
    return NextResponse.json({ message: 'Something went wrong while creating your order.' }, { status: 500 });
  }
}
