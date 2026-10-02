import { NextResponse } from 'next/server';
import { createBooking } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const booking = await createBooking({
      reference: body.reference,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      type: body.type || 'shop',
      starts_at: body.starts_at,
      status: 'requested',
      notes: body.notes,
    });

    return NextResponse.json({ success: true, booking });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
