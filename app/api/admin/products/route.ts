import { NextResponse } from 'next/server';
import { getProducts, getAllCategories, saveProduct, deleteOrArchiveProduct, addAuditLog } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export async function GET() {
  try {
    const products = await getProducts({ includeArchived: true });
    const categories = await getAllCategories();
    return NextResponse.json({ products, categories });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const saved = await saveProduct(body);

    addAuditLog({
      actor_email: 'henryaplus82@gmail.com',
      action: body.id ? 'product.update' : 'product.create',
      entity: 'products',
      entity_id: saved.id,
      after: { name: saved.name, price_kobo: saved.price_kobo, is_visible: saved.is_visible },
    });

    return NextResponse.json({ success: true, product: saved });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Missing product ID' }, { status: 400 });

    const result = await deleteOrArchiveProduct(id);

    addAuditLog({
      actor_email: 'henryaplus82@gmail.com',
      action: result.archived ? 'product.archive' : 'product.delete',
      entity: 'products',
      entity_id: id,
      after: { archived: result.archived },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
