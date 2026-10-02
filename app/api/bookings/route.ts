import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createBooking } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateBookingReference } from '@/lib/money';
import { emailSchema, nameSchema, parsePublicForm, phoneSchema } from '@/lib/public-form';

export const dynamic = 'force-dynamic';

const schema = z.object({
  customer_name: nameSchema,
  customer_email: emailSchema,
  customer_phone: phoneSchema,
  type: z.enum(['shop', 'video']).default('shop'),
  starts_at: z
    .string()
    .datetime({ offset: true, message: 'Please choose a valid date and time' })
    .refine((v) => new Date(v).getTime() > Date.now() + 60 * 60 * 1000, 'Please choose a time at least one hour from now'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const form = await parsePublicForm(req, { schema, bucket: 'booking', limit: 5, windowSeconds: 60 * 60 });
  if (!form.ok) return form.response;
  const body = form.data;

  try {
    const user = await getCurrentUser();
    const booking = await createBooking({
      reference: generateBookingReference(),
      user_id: user?.id ?? null,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      type: body.type,
      starts_at: new Date(body.starts_at).toISOString(),
      notes: body.notes || undefined,
    });
    return NextResponse.json({ success: true, reference: booking.reference, starts_at: booking.starts_at });
  } catch (err) {
    console.error('[bookings] create failed:', err);
    return NextResponse.json({ message: 'We could not save your booking right now. Please try again or reach us on WhatsApp.' }, { status: 500 });
  }
}
