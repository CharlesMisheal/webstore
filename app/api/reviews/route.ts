import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createReview, getProductById } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { nameSchema, parsePublicForm } from '@/lib/public-form';

export const dynamic = 'force-dynamic';

const schema = z.object({
  product_id: z.string().trim().min(1).max(64).optional(),
  author_name: nameSchema,
  author_location: z.string().trim().max(120).optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
});

/** Public review submission. Reviews start as `under_review` and only appear once the owner approves them. */
export async function POST(req: NextRequest) {
  const form = await parsePublicForm(req, { schema, bucket: 'review', limit: 3, windowSeconds: 60 * 60 });
  if (!form.ok) return form.response;
  const body = form.data;

  try {
    if (body.product_id) {
      const product = await getProductById(body.product_id);
      if (!product) return NextResponse.json({ message: 'product_id: unknown product' }, { status: 400 });
    }
    const user = await getCurrentUser();
    const review = await createReview({
      product_id: body.product_id ?? null,
      user_id: user?.id ?? null,
      author_name: body.author_name,
      author_location: body.author_location || undefined,
      rating: body.rating,
      body: body.body,
    });
    return NextResponse.json({ success: true, id: review.id, status: review.status });
  } catch (err) {
    console.error('[reviews] create failed:', err);
    return NextResponse.json({ message: 'We could not save your review right now. Please try again later.' }, { status: 500 });
  }
}
