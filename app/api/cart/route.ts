import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { applyUserCartOps, getUserCart, MAX_CART_LINE_QTY } from '@/lib/db';

export const dynamic = 'force-dynamic';

const line = {
  variant_id: z.string().trim().min(1).max(64),
  fit_type: z.enum(['ready_to_wear', 'bespoke']),
};

const patchSchema = z.object({
  ops: z
    .array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('add'), ...line, qty: z.number().int().min(1).max(MAX_CART_LINE_QTY) }),
        z.object({ type: z.literal('set'), ...line, qty: z.number().int().min(0).max(MAX_CART_LINE_QTY) }),
        z.object({ type: z.literal('remove'), ...line }),
        z.object({ type: z.literal('clear') }),
      ])
    )
    .min(1)
    .max(100),
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

/** PATCH /api/cart — applies line-level changes to the signed-in shopper's saved cart. Prices are never accepted from the client. */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false, code: 'SIGN_IN_REQUIRED' }, { status: 401, headers: noStore });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid cart changes.' }, { status: 400, headers: noStore });
  }

  try {
    const items = await applyUserCartOps(user.id, parsed.data.ops);
    return NextResponse.json({ signedIn: true, userId: user.id, items }, { headers: noStore });
  } catch (err) {
    console.error('[cart] save failed:', err);
    return NextResponse.json({ message: 'Could not save your bag.' }, { status: 500, headers: noStore });
  }
}
