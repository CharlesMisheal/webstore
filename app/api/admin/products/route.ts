import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getProducts, getAllCategories, saveProduct, deleteOrArchiveProduct, addAuditLog, getProductById } from '@/lib/db';
import { errorResponse, requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** Primary keys are text (uuid by default, but seed rows use slugs like `prod_navy_executive`). */
const idSchema = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/, 'Invalid id');

const imageSchema = z.object({
  id: z.string().optional(),
  storage_path: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Image must be a /public path or an https URL'),
  alt: z.string().trim().max(200).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_cover: z.boolean().optional(),
});

const variantSchema = z.object({
  id: z.string().optional(),
  size_label: z.string().trim().min(1).max(40),
  sku: z.string().trim().max(60).optional(),
  stock: z.number().int().min(0).max(100_000),
});

const productSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(2, 'Name is too short').max(120),
  slug: z.string().trim().max(140).optional(),
  category_id: idSchema.nullable().optional().or(z.literal('')),
  description: z.string().trim().max(5000).optional(),
  price_kobo: z.number().int('Price must be whole kobo').min(0).max(1_000_000_000_00),
  is_bespoke: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  images: z.array(imageSchema).max(12).optional(),
  variants: z.array(variantSchema).max(30).optional(),
});

function meta(req: NextRequest) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    user_agent: req.headers.get('user-agent') || undefined,
  };
}

/** GET /api/admin/products — owner-only list including archived products. */
export async function GET() {
  try {
    await requireAdmin();
    const [products, categories] = await Promise.all([getProducts({ includeArchived: true }), getAllCategories()]);
    return NextResponse.json({ products, categories });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/admin/products — create or update. Variants/images are replaced wholesale. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = productSchema.parse(await req.json());

    if (body.variants && body.variants.length > 0) {
      const labels = body.variants.map((v) => v.size_label.toLowerCase());
      if (new Set(labels).size !== labels.length) return NextResponse.json({ message: 'Duplicate size labels' }, { status: 400 });
    }

    const before = body.id ? await getProductById(body.id) : null;
    if (body.id && !before) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    const saved = await saveProduct({
      ...body,
      category_id: body.category_id || null,
      images: body.images?.map((img, i) => ({ ...img, alt: img.alt ?? '', sort_order: img.sort_order ?? i + 1, is_cover: img.is_cover ?? i === 0 })),
      variants: body.variants?.map((v) => ({ ...v, sku: v.sku ?? '' })),
    });

    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: body.id ? 'product.update' : 'product.create',
      entity: 'products',
      entity_id: saved.id,
      before: before ? { name: before.name, price_kobo: before.price_kobo, is_visible: before.is_visible, variants: before.variants.length } : null,
      after: { name: saved.name, price_kobo: saved.price_kobo, is_visible: saved.is_visible, variants: saved.variants.length },
      ...meta(req),
    });

    revalidatePath('/shop');
    revalidatePath(`/product/${saved.slug}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, product: saved });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    if (err instanceof Error && /duplicate key|unique/i.test(err.message)) return NextResponse.json({ message: 'A product with that slug already exists' }, { status: 409 });
    return errorResponse(err);
  }
}

/** DELETE /api/admin/products?id= — hard-delete if never ordered, otherwise soft-archive. */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const id = idSchema.safeParse(new URL(req.url).searchParams.get('id'));
    if (!id.success) return NextResponse.json({ message: 'Missing or invalid product ID' }, { status: 400 });

    const before = await getProductById(id.data);
    if (!before) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    const result = await deleteOrArchiveProduct(id.data);

    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: result.archived ? 'product.archive' : 'product.delete',
      entity: 'products',
      entity_id: id.data,
      before: { name: before.name, is_visible: before.is_visible },
      after: { archived: result.archived },
      ...meta(req),
    });

    revalidatePath('/shop');
    revalidatePath('/');

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
