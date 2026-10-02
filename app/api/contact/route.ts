import { NextResponse } from 'next/server';
import { addAuditLog } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    addAuditLog({
      actor_email: body.email || 'anonymous',
      action: 'contact.message_received',
      entity: 'contact_messages',
      after: { name: body.name, email: body.email, message: body.message },
    });

    return NextResponse.json({ success: true, message: 'Message logged' });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
