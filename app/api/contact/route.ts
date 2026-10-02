import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createContactMessage } from '@/lib/db';
import { emailSchema, nameSchema, parsePublicForm, phoneSchema } from '@/lib/public-form';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please tell us a little more (at least 10 characters)').max(3000),
});

export async function POST(req: NextRequest) {
  const form = await parsePublicForm(req, { schema, bucket: 'contact', limit: 5, windowSeconds: 60 * 60 });
  if (!form.ok) return form.response;

  try {
    const saved = await createContactMessage({
      name: form.data.name,
      email: form.data.email,
      phone: form.data.phone || undefined,
      message: form.data.message,
    });
    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('[contact] create failed:', err);
    return NextResponse.json({ message: 'We could not send your message right now. Please try WhatsApp instead.' }, { status: 500 });
  }
}
