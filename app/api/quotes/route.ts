import { NextResponse } from 'next/server';
import { createQuote } from '@/lib/db';
import { sendQuoteReceivedEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const quote = await createQuote({
      reference: body.reference,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      garment: body.garment,
      occasion: body.occasion,
      event_date: body.event_date,
      budget_min_kobo: body.budget_min_kobo,
      budget_max_kobo: body.budget_max_kobo,
      notes: body.notes,
      photo_paths: body.photo_paths || [],
      contact_preference: body.contact_preference || 'WhatsApp',
      status: 'requested',
    });

    // Send email confirmation
    await sendQuoteReceivedEmail(quote);

    return NextResponse.json({ success: true, quote });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
