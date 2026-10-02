import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { consumeRateLimit } from './db';

/** Common plumbing for public POST forms: rate limit by IP, then zod-validate the JSON body. */
export async function parsePublicForm<T extends z.ZodTypeAny>(
  req: NextRequest,
  opts: { schema: T; bucket: string; limit: number; windowSeconds: number }
): Promise<{ ok: true; data: z.infer<T>; ip: string } | { ok: false; response: NextResponse }> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

  if (!(await consumeRateLimit(`${opts.bucket}:${ip}`, opts.limit, opts.windowSeconds))) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Too many requests. Please wait a few minutes and try again.' }, { status: 429 }),
    };
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }) };
  }

  // Honeypot: bots fill every field; humans never see `website`.
  if (json && typeof json === 'object' && typeof (json as Record<string, unknown>).website === 'string' && (json as Record<string, unknown>).website) {
    return { ok: false, response: NextResponse.json({ success: true }, { status: 200 }) };
  }

  const parsed = opts.schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || 'form';
    return {
      ok: false,
      response: NextResponse.json({ message: `${field}: ${issue?.message ?? 'invalid'}`, field, issues: parsed.error.issues }, { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data, ip };
}

export const nameSchema = z.string().trim().min(2, 'Please enter your name').max(120);
export const emailSchema = z.string().trim().email('Please enter a valid email').max(254).transform((v) => v.toLowerCase());
export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Please enter a valid phone number')
  .max(32)
  .regex(/^[+()\d\s-]+$/, 'Phone may only contain digits, spaces, +, - and brackets');
