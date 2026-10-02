import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder, getProductById } from '@/lib/db';
import { initializePaystackTransaction } from '@/lib/paystack';
import { calculateLineTotal, calculateTotal } from '@/lib/money';

const orderSchema = z.object({
  order_number: z.string(),
  customer_name: z.string().min(2),
  customer_email: z.string().email(),
  customer_phone: z.string().min(8),
  shipping_address: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    deliveryOptionId: z.string(),
    deliveryMethod: z.string(),
    deliveryNotes: z.string().optional(),
  }),
  delivery_fee_kobo: z.number().int().min(0),
  items: z.array(
    z.object({
      product_id: z.string(),
      variant_id: z.string(),
      name_snapshot: z.string(),
      size_snapshot: z.string(),
      fit_type: z.enum(['ready_to_wear', 'bespoke']),
      qty: z.number().int().min(1),
    })
  ).min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = orderSchema.parse(json);

    // Hard Rule from developer-note.md:
    // Never trust client prices or totals. Recalculate everything server-side.
    let verifiedSubtotalKobo = 0;
    const verifiedItems = [];

    for (const item of parsed.items) {
      const dbProduct = await getProductById(item.product_id);
      if (!dbProduct) {
        return NextResponse.json({ message: `Product ${item.product_id} not found` }, { status: 400 });
      }

      const unitPriceKobo = dbProduct.price_kobo;
      const lineTotalKobo = calculateLineTotal(unitPriceKobo, item.qty);
      verifiedSubtotalKobo += lineTotalKobo;

      const coverImg = dbProduct.images.find((i) => i.is_cover) || dbProduct.images[0];

      verifiedItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: '',
        product_id: dbProduct.id,
        variant_id: item.variant_id,
        name_snapshot: dbProduct.name,
        size_snapshot: item.size_snapshot,
        fit_type: item.fit_type,
        unit_price_kobo: unitPriceKobo,
        qty: item.qty,
        line_total_kobo: lineTotalKobo,
        image_snapshot: coverImg?.storage_path,
      });
    }

    const verifiedTotalKobo = calculateTotal(verifiedSubtotalKobo, parsed.delivery_fee_kobo);

    // Save order with status 'pending'
    const createdOrder = await createOrder({
      order_number: parsed.order_number,
      customer_name: parsed.customer_name,
      customer_email: parsed.customer_email,
      customer_phone: parsed.customer_phone,
      status: 'pending',
      subtotal_kobo: verifiedSubtotalKobo,
      delivery_fee_kobo: parsed.delivery_fee_kobo,
      total_kobo: verifiedTotalKobo,
      currency: 'NGN',
      shipping_address: parsed.shipping_address,
      items: verifiedItems,
    });

    // Unique reference per attempt
    const reference = `APF-${parsed.order_number}-${Date.now().toString(36)}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const callbackUrl = `${siteUrl}/order/${parsed.order_number}/confirmation`;

    // Initialize Paystack
    const paystackResult = await initializePaystackTransaction({
      email: parsed.customer_email,
      amountKobo: verifiedTotalKobo,
      reference,
      callbackUrl,
      metadata: {
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
      },
    });

    return NextResponse.json({
      success: true,
      authorization_url: paystackResult.data?.authorization_url || `${callbackUrl}?reference=${reference}&demo=true`,
      reference,
      order_number: createdOrder.order_number,
    });
  } catch (err: unknown) {
    console.error('Paystack initialize error:', err);
    return NextResponse.json({ message: (err as Error).message || 'Server error' }, { status: 500 });
  }
}
