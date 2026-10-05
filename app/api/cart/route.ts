import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getUserCart, MAX_CART_LINE_QTY, replaceUserCart } from '@/lib/db';

export const dynamic = 'force-dynamic';

const putSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: z.string().trim().min(1).max(64),
        qty: z.number().int().min(1).max(MAX_CART_LINE_QTY),
        fit_type: z.enum(['ready_to_wear', 'bespoke']),
      })
    )
    .max(50),
});

const noStore = { 'Cache-Control': 'no-store' };

/** GET /api/cart — the signed-in shopper's saved cart, so it follows them across devices. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false }, { headers: noStore });
  try {
    const items = await getUserCart(user.id);
    return NextResponse.json({ signedIn: true, userId: user.id, items }, { headers: noStore });
  } catch (err) {
    console.error('[cart] load failed:', err);
    return NextResponse.json({ message: 'Could not load your saved bag.' }, { status: 500, headers: noStore });
  }
}

/** PUT /api/cart — replaces the signed-in shopper's saved cart. Prices are never accepted from the client. */
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false, code: 'SIGN_IN_REQUIRED' }, { status: 401, headers: noStore });

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid cart.' }, { status: 400, headers: noStore });
  }

  try {
    const items = await replaceUserCart(user.id, parsed.data.items);
    return NextResponse.json({ signedIn: true, userId: user.id, items }, { headers: noStore });
  } catch (err) {
    console.error('[cart] save failed:', err);
    return NextResponse.json({ message: 'Could not save your bag.' }, { status: 500, headers: noStore });
  }
}
