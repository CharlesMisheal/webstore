import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createQuote, getStoreSettings } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendQuoteReceivedEmail } from '@/lib/email';
import { generateQuoteReference } from '@/lib/money';
import { emailSchema, nameSchema, parsePublicForm, phoneSchema } from '@/lib/public-form';

export const dynamic = 'force-dynamic';

const schema = z.object({
  customer_name: nameSchema,
  customer_email: emailSchema,
  customer_phone: phoneSchema,
  garment: z.string().trim().min(2).max(120),
  occasion: z.string().trim().min(2).max(120),
  event_date: z.string().trim().max(32).optional().or(z.literal('')),
  budget_min_kobo: z.number().int().min(0).max(1_000_000_000).optional(),
  budget_max_kobo: z.number().int().min(0).max(1_000_000_000).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  photo_paths: z.array(z.string().max(500)).max(6).optional(),
  contact_preference: z.enum(['WhatsApp', 'Email', 'Phone']).default('WhatsApp'),
  has_measurements: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const form = await parsePublicForm(req, { schema, bucket: 'quote', limit: 5, windowSeconds: 60 * 60 });
  if (!form.ok) return form.response;
  const body = form.data;

  if (body.budget_min_kobo !== undefined && body.budget_max_kobo !== undefined && body.budget_max_kobo < body.budget_min_kobo) {
    return NextResponse.json({ message: 'budget: maximum must be at least the minimum' }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const quote = await createQuote({
      reference: generateQuoteReference(),
      user_id: user?.id ?? null,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      garment: body.garment,
      occasion: body.occasion,
      event_date: body.event_date || undefined,
      budget_min_kobo: body.budget_min_kobo,
      budget_max_kobo: body.budget_max_kobo,
      notes: body.notes || undefined,
      photo_paths: body.photo_paths ?? [],
      contact_preference: body.contact_preference,
    });

    // Best-effort acknowledgement email (the quote is saved regardless).
    getStoreSettings()
      .then((settings) => sendQuoteReceivedEmail(quote, settings, Boolean(body.has_measurements)))
      .catch((err) => console.error('[quotes] ack email failed:', err));

    return NextResponse.json({ success: true, reference: quote.reference });
  } catch (err) {
    console.error('[quotes] create failed:', err);
    return NextResponse.json({ message: 'We could not save your request right now. Please try again or reach us on WhatsApp.' }, { status: 500 });
  }
}
