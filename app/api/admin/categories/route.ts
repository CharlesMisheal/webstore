import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addAuditLog, deleteCategory, getAllCategories, reorderCategories, saveCategory } from '@/lib/db';
import { errorResponse, requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** Primary keys are text (uuid by default, but seed rows use slugs like `cat_suits`). */
const idSchema = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/, 'Invalid id');

const categorySchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(2, 'Name is too short').max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  image_path: z.string().trim().max(1000).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional(),
});

const reorderSchema = z.object({ order: z.array(idSchema).min(1).max(100) });

function meta(req: NextRequest) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    user_agent: req.headers.get('user-agent') || undefined,
  };
}

function revalidateStore() {
  revalidatePath('/', 'layout'); // categories appear in the nav + footer on every store page
}

/** GET /api/admin/categories — all categories incl. hidden (not soft-deleted). */
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ categories: await getAllCategories() });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/admin/categories — create/update a category, or `{ order: [ids] }` to reorder. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const json = await req.json();

    if (json && Array.isArray(json.order)) {
      const { order } = reorderSchema.parse(json);
      await reorderCategories(order);
      await addAuditLog({ actor_id: admin.id, actor_email: admin.email, action: 'category.reorder', entity: 'categories', after: { order }, ...meta(req) });
      revalidateStore();
      return NextResponse.json({ success: true });
    }

    const body = categorySchema.parse(json);
    const existing = body.id ? (await getAllCategories()).find((c) => c.id === body.id) : undefined;
    if (body.id && !existing) return NextResponse.json({ message: 'Category not found' }, { status: 404 });

    const saved = await saveCategory(body);
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: body.id ? 'category.update' : 'category.create',
      entity: 'categories',
      entity_id: saved.id,
      before: existing ? { name: existing.name, slug: existing.slug, is_visible: existing.is_visible } : null,
      after: { name: saved.name, slug: saved.slug, is_visible: saved.is_visible, sort_order: saved.sort_order },
      ...meta(req),
    });
    revalidateStore();
    return NextResponse.json({ success: true, category: saved });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    if (err instanceof Error && /duplicate key|unique/i.test(err.message)) return NextResponse.json({ message: 'A category with that slug already exists' }, { status: 409 });
    return errorResponse(err);
  }
}

/** DELETE /api/admin/categories?id= — refuses if products still reference the category. */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const id = idSchema.safeParse(new URL(req.url).searchParams.get('id'));
    if (!id.success) return NextResponse.json({ message: 'Missing or invalid category ID' }, { status: 400 });

    const existing = (await getAllCategories()).find((c) => c.id === id.data);
    if (!existing) return NextResponse.json({ message: 'Category not found' }, { status: 404 });

    const result = await deleteCategory(id.data);
    if (!result.success) return NextResponse.json({ message: result.message || 'Cannot delete this category' }, { status: 409 });

    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'category.delete',
      entity: 'categories',
      entity_id: id.data,
      before: { name: existing.name, slug: existing.slug },
      ...meta(req),
    });
    revalidateStore();
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
