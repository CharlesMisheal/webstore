/**
 * Data layer for A-Plus Fashion Home — Supabase only.
 *
 * Every function runs on the server with the service-role client (RLS is
 * bypassed), so authorization MUST happen before calling anything that writes:
 *   - storefront writes are validated + rate-limited in their route handlers
 *   - admin writes go through requireAdmin() first
 *
 * Reads degrade gracefully (empty list / defaults + console.error) so the
 * storefront still renders while the database is being provisioned. Writes throw.
 */

import { randomUUID } from 'crypto';
import { unstable_cache, revalidateTag } from 'next/cache';
import { createAdminSupabase, isSupabaseConfigured } from './supabase/server';
import { DEFAULT_STORE_SETTINGS } from './store-defaults';
import {
  AuditLogEntry,
  Booking,
  BookingStatus,
  Category,
  ContactMessage,
  CustomerSummary,
  Measurements,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  Payment,
  PaymentStatus,
  Product,
  ProductImage,
  ProductVariant,
  Profile,
  Quote,
  QuoteStatus,
  Refund,
  RefundStatus,
  Review,
  ReviewStatus,
  StoreSettingKey,
  StoreSettingRow,
  StoreSettings,
} from './types';

type Row = Record<string, any>;

function db() {
  return createAdminSupabase();
}

async function safeRead<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.error(`[db] ${label} failed:`, error instanceof Error ? error.message : error);
    return fallback;
  }
}

function must<T>(result: { data: T | null; error: { message: string } | null }, label: string): NonNullable<T> {
  if (result.error) throw new Error(`[db] ${label}: ${result.error.message}`);
  if (result.data === null || result.data === undefined) throw new Error(`[db] ${label}: no data returned`);
  return result.data as NonNullable<T>;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export { DEFAULT_STORE_SETTINGS };

// ==================== NORMALIZERS ====================

function normalizeCategory(r: Row): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    image_path: r.image_path ?? '',
    sort_order: Number(r.sort_order ?? 0),
    is_visible: r.is_visible ?? true,
    deleted_at: r.deleted_at ?? null,
    created_at: r.created_at,
  };
}

function normalizeImage(r: Row): ProductImage {
  return {
    id: r.id,
    product_id: r.product_id,
    storage_path: r.storage_path,
    alt: r.alt ?? '',
    sort_order: Number(r.sort_order ?? 0),
    is_cover: Boolean(r.is_cover),
  };
}

function normalizeVariant(r: Row): ProductVariant {
  return {
    id: r.id,
    product_id: r.product_id,
    size_label: r.size_label,
    sku: r.sku ?? '',
    stock: Number(r.stock ?? 0),
  };
}

function normalizeProduct(r: Row): Product {
  const images = (Array.isArray(r.images) ? r.images : []).map(normalizeImage).sort((a, b) => a.sort_order - b.sort_order);
  const variants = (Array.isArray(r.variants) ? r.variants : []).map(normalizeVariant);
  return {
    id: r.id,
    category_id: r.category_id ?? undefined,
    category: r.category ? normalizeCategory(r.category) : undefined,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    price_kobo: Number(r.price_kobo ?? 0),
    is_bespoke: Boolean(r.is_bespoke),
    is_featured: Boolean(r.is_featured),
    is_visible: r.is_visible ?? true,
    archived_at: r.archived_at ?? null,
    images,
    variants,
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
  };
}

function normalizePayment(r: Row): Payment {
  return {
    reference: r.reference,
    order_id: r.order_id,
    provider: 'paystack',
    channel: r.channel ?? undefined,
    amount_kobo: Number(r.amount_kobo ?? 0),
    status: r.status as PaymentStatus,
    refund_status: (r.refund_status ?? 'none') as RefundStatus,
    raw: r.raw ?? undefined,
    paid_at: r.paid_at ?? undefined,
    created_at: r.created_at,
  };
}

function normalizeOrderItem(r: Row): OrderItemSnapshot {
  return {
    id: r.id,
    order_id: r.order_id,
    product_id: r.product_id ?? undefined,
    variant_id: r.variant_id ?? undefined,
    name_snapshot: r.name_snapshot,
    size_snapshot: r.size_snapshot,
    fit_type: r.fit_type ?? 'ready_to_wear',
    unit_price_kobo: Number(r.unit_price_kobo ?? 0),
    qty: Number(r.qty ?? 1),
    line_total_kobo: Number(r.line_total_kobo ?? 0),
    image_snapshot: r.image_snapshot ?? undefined,
  };
}

function normalizeOrder(r: Row): Order {
  const payments = (Array.isArray(r.payments) ? r.payments : [])
    .map(normalizePayment)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const payment = payments.find((p) => p.status === 'success') ?? payments[0];
  return {
    id: r.id,
    order_number: r.order_number,
    user_id: r.user_id ?? null,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    status: r.status as OrderStatus,
    subtotal_kobo: Number(r.subtotal_kobo ?? 0),
    delivery_fee_kobo: Number(r.delivery_fee_kobo ?? 0),
    total_kobo: Number(r.total_kobo ?? 0),
    currency: r.currency ?? 'NGN',
    shipping_address: r.shipping_address ?? {},
    tracking_url: r.tracking_url ?? null,
    internal_note: r.internal_note ?? null,
    confirmation_sent_at: r.confirmation_sent_at ?? null,
    cancelled_at: r.cancelled_at ?? null,
    cancel_reason: r.cancel_reason ?? null,
    placed_at: r.placed_at,
    updated_at: r.updated_at,
    items: (Array.isArray(r.items) ? r.items : []).map(normalizeOrderItem),
    payment,
    payments,
  };
}

function normalizeQuote(r: Row): Quote {
  return {
    id: r.id,
    reference: r.reference,
    user_id: r.user_id ?? null,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    garment: r.garment,
    occasion: r.occasion,
    event_date: r.event_date ?? undefined,
    budget_min_kobo: r.budget_min_kobo != null ? Number(r.budget_min_kobo) : undefined,
    budget_max_kobo: r.budget_max_kobo != null ? Number(r.budget_max_kobo) : undefined,
    notes: r.notes ?? undefined,
    photo_paths: Array.isArray(r.photo_paths) ? r.photo_paths : [],
    contact_preference: r.contact_preference ?? 'WhatsApp',
    status: r.status as QuoteStatus,
    quoted_price_kobo: r.quoted_price_kobo != null ? Number(r.quoted_price_kobo) : null,
    ready_by: r.ready_by ?? null,
    owner_message: r.owner_message ?? null,
    reply_sent_at: r.reply_sent_at ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function normalizeBooking(r: Row): Booking {
  return {
    id: r.id,
    reference: r.reference,
    user_id: r.user_id ?? null,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    type: r.type,
    starts_at: r.starts_at,
    status: r.status as BookingStatus,
    notes: r.notes ?? undefined,
    created_at: r.created_at,
  };
}

function normalizeReview(r: Row): Review {
  return {
    id: r.id,
    product_id: r.product_id ?? undefined,
    product_name: r.product?.name ?? undefined,
    user_id: r.user_id ?? null,
    author_name: r.author_name,
    author_location: r.author_location ?? undefined,
    rating: Number(r.rating),
    body: r.body,
    status: r.status as ReviewStatus,
    created_at: r.created_at,
  };
}

function normalizeProfile(r: Row): Profile {
  return {
    id: r.id,
    email: r.email ?? '',
    full_name: r.full_name ?? '',
    phone: r.phone ?? undefined,
    country: r.country ?? 'Nigeria',
    role: r.role ?? 'customer',
    welcome_sent_at: r.welcome_sent_at ?? null,
    measurements: r.measurements ?? null,
    created_at: r.created_at,
  };
}

const PRODUCT_SELECT = '*, category:categories(*), images:product_images(*), variants:product_variants(*)';
const ORDER_SELECT = '*, items:order_items(*), payments(*)';

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  return safeRead('getCategories', async () => {
    const res = await db().from('categories').select('*').eq('is_visible', true).is('deleted_at', null).order('sort_order');
    return must(res, 'getCategories').map(normalizeCategory);
  }, []);
}

export async function getAllCategories(): Promise<Category[]> {
  return safeRead('getAllCategories', async () => {
    const res = await db().from('categories').select('*').is('deleted_at', null).order('sort_order');
    return must(res, 'getAllCategories').map(normalizeCategory);
  }, []);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return safeRead('getCategoryBySlug', async () => {
    const res = await db().from('categories').select('*').eq('slug', slug).is('deleted_at', null).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeCategory(res.data) : null;
  }, null);
}

export async function saveCategory(input: Partial<Category> & { name: string }): Promise<Category> {
  const payload: Row = {
    name: input.name.trim(),
    slug: slugify(input.slug || input.name),
    description: input.description ?? null,
    image_path: input.image_path ?? null,
    is_visible: input.is_visible ?? true,
  };
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;

  if (input.id) {
    const res = await db().from('categories').update(payload).eq('id', input.id).select('*').single();
    return normalizeCategory(must(res, 'saveCategory.update'));
  }
  if (payload.sort_order === undefined) {
    const countRes = await db().from('categories').select('id', { count: 'exact', head: true }).is('deleted_at', null);
    payload.sort_order = (countRes.count ?? 0) + 1;
  }
  const res = await db().from('categories').insert(payload).select('*').single();
  return normalizeCategory(must(res, 'saveCategory.insert'));
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, idx) => db().from('categories').update({ sort_order: idx + 1 }).eq('id', id))
  );
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  const countRes = await db()
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
    .is('archived_at', null);
  if ((countRes.count ?? 0) > 0) {
    return { success: false, message: 'This category still has products. Move or archive them first.' };
  }
  const res = await db().from('categories').update({ deleted_at: new Date().toISOString(), is_visible: false }).eq('id', id).select('id');
  if (res.error) return { success: false, message: res.error.message };
  if (!res.data?.length) return { success: false, message: 'Category not found' };
  return { success: true };
}

// ==================== PRODUCTS ====================

export interface ProductQuery {
  categoryId?: string;
  categorySlug?: string;
  featuredOnly?: boolean;
  /** Admin: include archived + hidden products. */
  includeArchived?: boolean;
  searchQuery?: string;
}

export async function getProducts(options: ProductQuery = {}): Promise<Product[]> {
  return safeRead('getProducts', async () => {
    let query = db().from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false });
    if (!options.includeArchived) query = query.eq('is_visible', true).is('archived_at', null);
    if (options.categoryId) query = query.eq('category_id', options.categoryId);
    if (options.featuredOnly) query = query.eq('is_featured', true);

    let list = must(await query, 'getProducts').map(normalizeProduct);

    if (options.categorySlug) list = list.filter((p) => p.category?.slug === options.categorySlug);

    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.variants.some((v) => v.size_label.toLowerCase().includes(q))
      );
    }
    return list;
  }, []);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return safeRead('getProductBySlug', async () => {
    const res = await db().from('products').select(PRODUCT_SELECT).eq('slug', slug).is('archived_at', null).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeProduct(res.data) : null;
  }, null);
}

export async function getProductById(id: string): Promise<Product | null> {
  return safeRead('getProductById', async () => {
    const res = await db().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeProduct(res.data) : null;
  }, null);
}

export async function getVariantsByIds(ids: string[]): Promise<(ProductVariant & { product: Product })[]> {
  if (ids.length === 0) return [];
  const res = await db()
    .from('product_variants')
    .select('*, product:products(*, images:product_images(*))')
    .in('id', ids);
  return must(res, 'getVariantsByIds').map((r: Row) => ({
    ...normalizeVariant(r),
    product: normalizeProduct({ ...r.product, variants: [] }),
  }));
}

export interface SaveProductInput {
  id?: string;
  name: string;
  slug?: string;
  category_id?: string | null;
  description?: string;
  price_kobo: number;
  is_bespoke?: boolean;
  is_featured?: boolean;
  is_visible?: boolean;
  images?: Array<Pick<ProductImage, 'storage_path' | 'alt' | 'sort_order' | 'is_cover'> & { id?: string }>;
  variants?: Array<Pick<ProductVariant, 'size_label' | 'sku' | 'stock'> & { id?: string }>;
}

export async function saveProduct(input: SaveProductInput): Promise<Product> {
  const base: Row = {
    name: input.name.trim(),
    slug: slugify(input.slug || input.name),
    category_id: input.category_id || null,
    description: input.description ?? '',
    price_kobo: Math.max(0, Math.floor(input.price_kobo)),
    is_bespoke: input.is_bespoke ?? false,
    is_featured: input.is_featured ?? false,
    is_visible: input.is_visible ?? true,
    updated_at: new Date().toISOString(),
  };

  let productId = input.id;
  if (productId) {
    must(await db().from('products').update(base).eq('id', productId).select('id').single(), 'saveProduct.update');
  } else {
    const created = must<Row>(await db().from('products').insert(base).select('id').single(), 'saveProduct.insert');
    productId = created.id as string;
  }

  if (input.images) await syncChildRows('product_images', productId, input.images.map((img, i) => ({
    id: img.id,
    storage_path: img.storage_path,
    alt: img.alt ?? '',
    sort_order: img.sort_order ?? i + 1,
    is_cover: Boolean(img.is_cover),
  })));

  if (input.variants) await syncChildRows('product_variants', productId, input.variants.map((v) => ({
    id: v.id,
    size_label: v.size_label.trim(),
    sku: v.sku ?? null,
    stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
  })));

  const saved = await getProductById(productId);
  if (!saved) throw new Error('[db] saveProduct: product vanished after save');
  return saved;
}

/** Replace a product's child rows (images / variants), keeping ids that already belong to it. */
async function syncChildRows(table: 'product_images' | 'product_variants', productId: string, rows: Array<Row & { id?: string }>) {
  const existing = must(await db().from(table).select('id').eq('product_id', productId), `sync.${table}.existing`);
  const existingIds = new Set(existing.map((r: Row) => r.id as string));
  const keep = new Set<string>();

  const upserts = rows.map((row) => {
    const id = row.id && existingIds.has(row.id) ? row.id : randomUUID();
    keep.add(id);
    return { ...row, id, product_id: productId };
  });

  const toDelete = [...existingIds].filter((id) => !keep.has(id));
  if (toDelete.length) must(await db().from(table).delete().in('id', toDelete).select('id'), `sync.${table}.delete`);
  if (upserts.length) must(await db().from(table).upsert(upserts).select('id'), `sync.${table}.upsert`);
}

/**
 * developer-note.md §2.5 — products with order history are archived, never hard-deleted.
 */
export async function deleteOrArchiveProduct(id: string): Promise<{ archived: boolean; message: string }> {
  const countRes = await db().from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
  if (countRes.error) throw new Error(countRes.error.message);

  if ((countRes.count ?? 0) > 0) {
    must(
      await db().from('products').update({ archived_at: new Date().toISOString(), is_visible: false }).eq('id', id).select('id').single(),
      'archiveProduct'
    );
    return { archived: true, message: 'This garment has order history, so it was archived (hidden) instead of deleted.' };
  }
  must(await db().from('products').delete().eq('id', id).select('id').single(), 'deleteProduct');
  return { archived: false, message: 'Garment deleted permanently (it had no order history).' };
}

export async function restoreProduct(id: string): Promise<void> {
  must(await db().from('products').update({ archived_at: null }).eq('id', id).select('id').single(), 'restoreProduct');
}

export async function setProductsVisibility(ids: string[], isVisible: boolean): Promise<void> {
  if (!ids.length) return;
  must(await db().from('products').update({ is_visible: isVisible }).in('id', ids).select('id'), 'setProductsVisibility');
}

// ==================== ORDERS ====================

export interface OrderQuery {
  status?: OrderStatus | 'all';
  search?: string;
  limit?: number;
}

export async function getOrders(options: OrderQuery = {}): Promise<Order[]> {
  return safeRead('getOrders', async () => {
    let query = db().from('orders').select(ORDER_SELECT).order('placed_at', { ascending: false });
    if (options.status && options.status !== 'all') query = query.eq('status', options.status);
    if (options.search) {
      const q = options.search.replace(/[%,()]/g, ' ').trim();
      if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`);
    }
    if (options.limit) query = query.limit(options.limit);
    return must(await query, 'getOrders').map(normalizeOrder);
  }, []);
}

/** Orders for the account page: owned by the user id, or placed as a guest with the same email. */
export async function getOrdersForCustomer(userId: string, email: string): Promise<Order[]> {
  return safeRead('getOrdersForCustomer', async () => {
    const res = await db()
      .from('orders')
      .select(ORDER_SELECT)
      .or(`user_id.eq.${userId},customer_email.ilike.${email.replace(/[%,()]/g, '')}`)
      .order('placed_at', { ascending: false });
    return must(res, 'getOrdersForCustomer').map(normalizeOrder);
  }, []);
}

export async function getOrderById(id: string): Promise<Order | null> {
  return safeRead('getOrderById', async () => {
    const res = await db().from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeOrder(res.data) : null;
  }, null);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  return safeRead('getOrderByNumber', async () => {
    const res = await db().from('orders').select(ORDER_SELECT).eq('order_number', orderNumber.trim().toUpperCase()).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeOrder(res.data) : null;
  }, null);
}

export async function orderNumberExists(orderNumber: string): Promise<boolean> {
  const res = await db().from('orders').select('id', { count: 'exact', head: true }).eq('order_number', orderNumber);
  return (res.count ?? 0) > 0;
}

export interface CreateOrderInput {
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  total_kobo: number;
  shipping_address: Order['shipping_address'];
  items: Array<Omit<OrderItemSnapshot, 'id' | 'order_id'>>;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderRow = must<Row>(
    await db()
      .from('orders')
      .insert({
        order_number: input.order_number,
        user_id: input.user_id ?? null,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        status: 'pending',
        subtotal_kobo: input.subtotal_kobo,
        delivery_fee_kobo: input.delivery_fee_kobo,
        total_kobo: input.total_kobo,
        currency: 'NGN',
        shipping_address: input.shipping_address,
      })
      .select('id')
      .single(),
    'createOrder'
  );

  const itemsRes = await db()
    .from('order_items')
    .insert(input.items.map((item) => ({ ...item, order_id: orderRow.id as string })))
    .select('id');
  if (itemsRes.error) {
    await db().from('orders').delete().eq('id', orderRow.id as string);
    throw new Error(`[db] createOrder.items: ${itemsRes.error.message}`);
  }

  const order = await getOrderById(orderRow.id as string);
  if (!order) throw new Error('[db] createOrder: order vanished after insert');
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  patch: { status?: OrderStatus; tracking_url?: string | null; internal_note?: string | null }
): Promise<Order> {
  const update: Row = { updated_at: new Date().toISOString() };
  if (patch.status) update.status = patch.status;
  if (patch.tracking_url !== undefined) update.tracking_url = patch.tracking_url;
  if (patch.internal_note !== undefined) update.internal_note = patch.internal_note;
  if (patch.status === 'cancelled') update.cancelled_at = new Date().toISOString();

  must(await db().from('orders').update(update).eq('id', orderId).select('id').single(), 'updateOrderStatus');
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  return order;
}

export async function cancelOrder(orderId: string, reason: string): Promise<Order> {
  must(
    await db()
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('id')
      .single(),
    'cancelOrder'
  );
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  return order;
}

// ==================== PAYMENTS ====================

export async function createPaymentAttempt(orderId: string, reference: string, amountKobo: number): Promise<Payment> {
  const res = await db()
    .from('payments')
    .insert({ reference, order_id: orderId, provider: 'paystack', amount_kobo: amountKobo, status: 'initialized' })
    .select('*')
    .single();
  return normalizePayment(must(res, 'createPaymentAttempt'));
}

export async function getPaymentByReference(reference: string): Promise<(Payment & { order: Order | null }) | null> {
  return safeRead('getPaymentByReference', async () => {
    const res = await db().from('payments').select('*').eq('reference', reference).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    if (!res.data) return null;
    const payment = normalizePayment(res.data);
    const order = await getOrderById(payment.order_id);
    return { ...payment, order };
  }, null);
}

export async function getPayments(limit = 200): Promise<Array<Payment & { order_number?: string; customer_name?: string; customer_email?: string }>> {
  return safeRead('getPayments', async () => {
    const res = await db()
      .from('payments')
      .select('*, order:orders(order_number, customer_name, customer_email)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return must(res, 'getPayments').map((r: Row) => ({
      ...normalizePayment(r),
      order_number: r.order?.order_number,
      customer_name: r.order?.customer_name,
      customer_email: r.order?.customer_email,
    }));
  }, []);
}

export async function markPaymentStatus(reference: string, status: PaymentStatus, raw?: unknown): Promise<void> {
  // Never downgrade a successful payment.
  const res = await db()
    .from('payments')
    .update({ status, raw: raw ?? null })
    .eq('reference', reference)
    .neq('status', 'success')
    .select('reference');
  if (res.error) throw new Error(`[db] markPaymentStatus: ${res.error.message}`);
}

/** Atomic, idempotent paid transition (migration 2). Returns the order id if this call did the work. */
export async function applyPaidOrder(reference: string, channel: string, amountKobo: number, raw: unknown): Promise<string | null> {
  const res = await db().rpc('apply_paid_order', {
    p_reference: reference,
    p_channel: channel,
    p_amount_kobo: amountKobo,
    p_raw: raw ?? null,
  });
  if (res.error) throw new Error(`[db] apply_paid_order: ${res.error.message}`);
  return (res.data as string | null) ?? null;
}

export async function claimOrderConfirmation(orderId: string): Promise<boolean> {
  const res = await db().rpc('claim_order_confirmation', { p_order_id: orderId });
  if (res.error) throw new Error(`[db] claim_order_confirmation: ${res.error.message}`);
  return Boolean(res.data);
}

export async function updatePaymentRefundStatus(reference: string, refundStatus: RefundStatus): Promise<void> {
  must(await db().from('payments').update({ refund_status: refundStatus }).eq('reference', reference).select('reference'), 'updatePaymentRefundStatus');
}

export async function createRefund(input: { payment_id: string; amount_kobo: number; reason?: string; paystack_refund_id?: string; status: string; created_by: string }): Promise<Refund> {
  const res = await db().from('refunds').insert(input).select('*').single();
  const r = must(res, 'createRefund');
  return { ...r, amount_kobo: Number(r.amount_kobo) } as Refund;
}

export async function syncRefundFromWebhook(reference: string, status: 'processed' | 'failed' | 'pending', paystackRefundId?: string): Promise<void> {
  const refundStatus: RefundStatus = status === 'processed' ? 'full' : status === 'failed' ? 'none' : 'pending';
  await updatePaymentRefundStatus(reference, refundStatus);
  const update: Row = { status };
  if (paystackRefundId) update.paystack_refund_id = paystackRefundId;
  await db().from('refunds').update(update).eq('payment_id', reference);
}

export async function getRefunds(): Promise<Refund[]> {
  return safeRead('getRefunds', async () => {
    const res = await db().from('refunds').select('*').order('created_at', { ascending: false });
    return must(res, 'getRefunds').map((r: Row) => ({ ...r, amount_kobo: Number(r.amount_kobo) }) as Refund);
  }, []);
}

// ==================== QUOTES ====================

export async function getQuotes(): Promise<Quote[]> {
  return safeRead('getQuotes', async () => {
    const res = await db().from('quotes').select('*').order('created_at', { ascending: false });
    return must(res, 'getQuotes').map(normalizeQuote);
  }, []);
}

export async function getQuotesForCustomer(email: string): Promise<Quote[]> {
  return safeRead('getQuotesForCustomer', async () => {
    const res = await db().from('quotes').select('*').ilike('customer_email', email).order('created_at', { ascending: false });
    return must(res, 'getQuotesForCustomer').map(normalizeQuote);
  }, []);
}

export async function getQuoteByReference(reference: string): Promise<Quote | null> {
  return safeRead('getQuoteByReference', async () => {
    const res = await db().from('quotes').select('*').eq('reference', reference).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeQuote(res.data) : null;
  }, null);
}

export async function createQuote(input: Omit<Quote, 'id' | 'created_at' | 'status' | 'quoted_price_kobo' | 'ready_by' | 'owner_message'>): Promise<Quote> {
  const res = await db().from('quotes').insert({ ...input, status: 'requested' }).select('*').single();
  return normalizeQuote(must(res, 'createQuote'));
}

export async function replyQuote(id: string, quotedPriceKobo: number, readyBy: string, ownerMessage: string): Promise<Quote> {
  const res = await db()
    .from('quotes')
    .update({ status: 'quote_sent', quoted_price_kobo: quotedPriceKobo, ready_by: readyBy, owner_message: ownerMessage, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  return normalizeQuote(must(res, 'replyQuote'));
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
  const res = await db().from('quotes').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  return normalizeQuote(must(res, 'updateQuoteStatus'));
}

// ==================== BOOKINGS ====================

export async function getBookings(): Promise<Booking[]> {
  return safeRead('getBookings', async () => {
    const res = await db().from('bookings').select('*').order('starts_at', { ascending: false });
    return must(res, 'getBookings').map(normalizeBooking);
  }, []);
}

export async function getBookingsForCustomer(email: string): Promise<Booking[]> {
  return safeRead('getBookingsForCustomer', async () => {
    const res = await db().from('bookings').select('*').ilike('customer_email', email).order('starts_at', { ascending: false });
    return must(res, 'getBookingsForCustomer').map(normalizeBooking);
  }, []);
}

export async function createBooking(input: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
  const res = await db().from('bookings').insert({ ...input, status: 'requested' }).select('*').single();
  return normalizeBooking(must(res, 'createBooking'));
}

export async function updateBookingStatus(id: string, status: BookingStatus, newStartsAt?: string): Promise<Booking> {
  const update: Row = { status, updated_at: new Date().toISOString() };
  if (newStartsAt) update.starts_at = newStartsAt;
  const res = await db().from('bookings').update(update).eq('id', id).select('*').single();
  return normalizeBooking(must(res, 'updateBookingStatus'));
}

// ==================== REVIEWS ====================

export async function getReviews(productId?: string, approvedOnly = true): Promise<Review[]> {
  return safeRead('getReviews', async () => {
    let query = db().from('reviews').select('*, product:products(name)').order('created_at', { ascending: false });
    if (productId) query = query.eq('product_id', productId);
    if (approvedOnly) query = query.eq('status', 'approved');
    return must(await query, 'getReviews').map(normalizeReview);
  }, []);
}

export async function createReview(input: { product_id?: string | null; user_id?: string | null; author_name: string; author_location?: string; rating: number; body: string }): Promise<Review> {
  const res = await db().from('reviews').insert({ ...input, status: 'under_review' }).select('*').single();
  return normalizeReview(must(res, 'createReview'));
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<Review> {
  const res = await db().from('reviews').update({ status }).eq('id', id).select('*').single();
  return normalizeReview(must(res, 'updateReviewStatus'));
}

export async function deleteReview(id: string): Promise<boolean> {
  const res = await db().from('reviews').delete().eq('id', id).select('id');
  if (res.error) throw new Error(res.error.message);
  return (res.data?.length ?? 0) > 0;
}

// ==================== CONTACT MESSAGES ====================

export async function createContactMessage(input: { name: string; email: string; phone?: string; message: string }): Promise<ContactMessage> {
  const res = await db().from('contact_messages').insert(input).select('*').single();
  return must(res, 'createContactMessage') as ContactMessage;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  return safeRead('getContactMessages', async () => {
    const res = await db().from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
    return must(res, 'getContactMessages') as ContactMessage[];
  }, []);
}

export async function markContactHandled(id: string, handled: boolean): Promise<void> {
  must(await db().from('contact_messages').update({ handled }).eq('id', id).select('id').single(), 'markContactHandled');
}

// ==================== PROFILES / CUSTOMERS ====================

export async function getProfile(userId: string): Promise<Profile | null> {
  return safeRead('getProfile', async () => {
    const res = await db().from('profiles').select('*').eq('id', userId).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? normalizeProfile(res.data) : null;
  }, null);
}

export async function updateProfile(userId: string, patch: { full_name?: string; phone?: string; country?: string; measurements?: Measurements }): Promise<Profile> {
  const res = await db().from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId).select('*').single();
  return normalizeProfile(must(res, 'updateProfile'));
}

export async function claimWelcomeEmail(userId: string): Promise<boolean> {
  const res = await db().rpc('claim_welcome_email', { p_user_id: userId });
  if (res.error) throw new Error(`[db] claim_welcome_email: ${res.error.message}`);
  return Boolean(res.data);
}

export async function isAdminEmailInDb(userId: string, email: string): Promise<boolean> {
  return safeRead('isAdminEmailInDb', async () => {
    const [byRole, byAllowList] = await Promise.all([
      db().from('profiles').select('id').eq('id', userId).eq('role', 'owner').maybeSingle(),
      db().from('admins').select('email').ilike('email', email).maybeSingle(),
    ]);
    return Boolean(byRole.data) || Boolean(byAllowList.data);
  }, false);
}

export async function getCustomers(): Promise<CustomerSummary[]> {
  return safeRead('getCustomers', async () => {
    const [profilesRes, ordersRes] = await Promise.all([
      db().from('profiles').select('*').order('created_at', { ascending: false }),
      db().from('orders').select('id, user_id, customer_name, customer_email, customer_phone, total_kobo, status, placed_at'),
    ]);
    const profiles = must(profilesRes, 'getCustomers.profiles').map(normalizeProfile);
    const orders = must(ordersRes, 'getCustomers.orders') as Row[];

    const byId = new Map<string, CustomerSummary>();
    for (const p of profiles) {
      byId.set(p.id, {
        id: p.id, user_id: p.id, full_name: p.full_name || p.email, email: p.email, phone: p.phone, country: p.country,
        is_guest: false, order_count: 0, total_spent_kobo: 0, last_order_at: null, created_at: p.created_at,
      });
    }
    const emailToProfileId = new Map(profiles.map((p) => [p.email.toLowerCase(), p.id]));

    for (const o of orders) {
      const email = String(o.customer_email ?? '').toLowerCase();
      const key = o.user_id ?? emailToProfileId.get(email) ?? `guest:${email}`;
      if (!byId.has(key)) {
        byId.set(key, {
          id: key, user_id: null, full_name: o.customer_name, email: o.customer_email, phone: o.customer_phone,
          is_guest: true, order_count: 0, total_spent_kobo: 0, last_order_at: null,
        });
      }
      const c = byId.get(key)!;
      c.order_count += 1;
      if (!['pending', 'cancelled'].includes(o.status)) c.total_spent_kobo += Number(o.total_kobo ?? 0);
      if (!c.last_order_at || o.placed_at > c.last_order_at) c.last_order_at = o.placed_at;
    }
    return [...byId.values()].sort((a, b) => (b.last_order_at ?? b.created_at ?? '').localeCompare(a.last_order_at ?? a.created_at ?? ''));
  }, []);
}

export async function getCustomerDetail(id: string): Promise<{ customer: CustomerSummary; orders: Order[]; profile: Profile | null } | null> {
  const customers = await getCustomers();
  const customer = customers.find((c) => c.id === id);
  if (!customer) return null;
  const [profile, orders] = await Promise.all([
    customer.user_id ? getProfile(customer.user_id) : Promise.resolve(null),
    getOrdersForCustomer(customer.user_id ?? '00000000-0000-0000-0000-000000000000', customer.email),
  ]);
  return { customer, orders, profile };
}

// ==================== STORE SETTINGS ====================

const SETTINGS_TAG = 'store-settings';

function mergeSettings(rows: Row[]): StoreSettings {
  const merged: StoreSettings = JSON.parse(JSON.stringify(DEFAULT_STORE_SETTINGS));
  for (const row of rows) {
    const key = row.key as StoreSettingKey;
    if (key in merged && row.value !== null && row.value !== undefined) {
      (merged as Row)[key] = row.value;
    }
  }
  return merged;
}

const loadPublishedSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    return safeRead('getStoreSettings', async () => {
      const res = await db().from('store_settings').select('key, value');
      return mergeSettings(must(res, 'getStoreSettings'));
    }, DEFAULT_STORE_SETTINGS);
  },
  ['store-settings-published'],
  { tags: [SETTINGS_TAG], revalidate: 300 }
);

/** Published settings for the storefront (cached, revalidated on publish). */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured) return DEFAULT_STORE_SETTINGS;
  return loadPublishedSettings();
}

/** Admin: every row with its draft, uncached. */
export async function getStoreSettingRows(): Promise<StoreSettingRow[]> {
  return safeRead('getStoreSettingRows', async () => {
    const res = await db().from('store_settings').select('*');
    const rows = must(res, 'getStoreSettingRows') as Row[];
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return (Object.keys(DEFAULT_STORE_SETTINGS) as StoreSettingKey[]).map((key) => {
      const r = byKey.get(key);
      return {
        key,
        value: (r?.value ?? DEFAULT_STORE_SETTINGS[key]) as never,
        draft_value: (r?.draft_value ?? null) as never,
        updated_by: r?.updated_by ?? null,
        updated_at: r?.updated_at,
      };
    });
  }, []);
}

export async function saveSettingDraft<K extends StoreSettingKey>(key: K, draft: StoreSettings[K], updatedBy: string): Promise<void> {
  const existing = await db().from('store_settings').select('key').eq('key', key).maybeSingle();
  if (existing.data) {
    must(await db().from('store_settings').update({ draft_value: draft, updated_by: updatedBy, updated_at: new Date().toISOString() }).eq('key', key).select('key'), 'saveSettingDraft');
  } else {
    must(await db().from('store_settings').insert({ key, value: DEFAULT_STORE_SETTINGS[key], draft_value: draft, updated_by: updatedBy }).select('key'), 'saveSettingDraft.insert');
  }
}

export async function publishSetting<K extends StoreSettingKey>(key: K, value: StoreSettings[K], updatedBy: string): Promise<void> {
  must(
    await db().from('store_settings').upsert({ key, value, draft_value: null, updated_by: updatedBy, updated_at: new Date().toISOString() }).select('key'),
    'publishSetting'
  );
  revalidateTag(SETTINGS_TAG);
}

export async function discardSettingDraft(key: StoreSettingKey): Promise<void> {
  must(await db().from('store_settings').update({ draft_value: null }).eq('key', key).select('key'), 'discardSettingDraft');
}

// ==================== AUDIT LOG ====================

export async function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
  try {
    const res = await db().from('audit_log').insert({
      actor_id: entry.actor_id ?? null,
      actor_email: entry.actor_email,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip: entry.ip || null,
      user_agent: entry.user_agent ?? null,
    });
    if (res.error) throw new Error(res.error.message);
  } catch (error) {
    // Auditing must never break the primary operation, but it must be loud.
    console.error('[audit] failed to write audit_log row:', error instanceof Error ? error.message : error, entry.action);
  }
}

export async function getAuditLogs(limit = 300): Promise<AuditLogEntry[]> {
  return safeRead('getAuditLogs', async () => {
    const res = await db().from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
    return (must(res, 'getAuditLogs') as Row[]).map((r) => ({ ...r, id: Number(r.id), ip: r.ip ?? undefined }) as AuditLogEntry);
  }, []);
}

export async function getAuditLogsForEntity(entity: string, entityId: string): Promise<AuditLogEntry[]> {
  return safeRead('getAuditLogsForEntity', async () => {
    const res = await db().from('audit_log').select('*').eq('entity', entity).eq('entity_id', entityId).order('created_at', { ascending: false });
    return (must(res, 'getAuditLogsForEntity') as Row[]).map((r) => ({ ...r, id: Number(r.id), ip: r.ip ?? undefined }) as AuditLogEntry);
  }, []);
}

// ==================== RATE LIMITING ====================

/** Fixed-window limiter backed by Postgres (works across serverless instances). Fails open if the DB is down. */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const res = await db().rpc('consume_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (res.error) throw new Error(res.error.message);
    return Boolean(res.data);
  } catch (error) {
    console.error('[rate-limit] check failed, allowing request:', error instanceof Error ? error.message : error);
    return true;
  }
}
