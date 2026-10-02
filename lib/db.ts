import fs from 'node:fs';
import path from 'node:path';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_QUOTES,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_STORE_SETTINGS,
  INITIAL_AUDIT_LOGS,
} from './mock-data';
import { hasSupabaseConfig, supabase, supabaseAdmin } from './supabase';
import {
  Category,
  Product,
  Order,
  Quote,
  Booking,
  Review,
  StoreSettings,
  AuditLogEntry,
  OrderStatus,
  QuoteStatus,
  BookingStatus,
  ReviewStatus,
} from './types';

// Global singleton storage in Node global to preserve state across Next.js API requests and hot-reloads
interface StoreState {
  categories: Category[];
  products: Product[];
  orders: Order[];
  quotes: Quote[];
  bookings: Booking[];
  reviews: Review[];
  settings: StoreSettings;
  auditLogs: AuditLogEntry[];
}

const globalForDb = global as unknown as { storeState?: StoreState };

const STORE_FILE = process.env.APLUS_STORE_FILE || path.join(process.cwd(), 'data', 'store.json');

function getInitialState(): StoreState {
  return {
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    quotes: JSON.parse(JSON.stringify(INITIAL_QUOTES)),
    bookings: JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
    reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
    settings: JSON.parse(JSON.stringify(INITIAL_STORE_SETTINGS)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  };
}

function ensureStoreFile(): void {
  const dir = path.dirname(STORE_FILE);
  fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(getInitialState(), null, 2), 'utf8');
  }
}

function readStoreFile(): StoreState {
  const fallback = getInitialState();

  try {
    ensureStoreFile();
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    if (!raw.trim()) return fallback;

    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : fallback.categories,
      products: Array.isArray(parsed.products) ? parsed.products : fallback.products,
      orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : fallback.quotes,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : fallback.bookings,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : fallback.reviews,
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings as StoreSettings : fallback.settings,
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : fallback.auditLogs,
    };
  } catch (error) {
    console.warn('Falling back to built-in store data because the persisted store file could not be read.', error);
    ensureStoreFile();
    return fallback;
  }
}

function persistStore(): void {
  try {
    ensureStoreFile();
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to persist store state.', error);
  }
}

if (!globalForDb.storeState) {
  globalForDb.storeState = readStoreFile();
}

const state = globalForDb.storeState;

async function withSupabaseOrLocal<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  if (!hasSupabaseConfig || !supabase) {
    return fallback();
  }

  try {
    return await operation();
  } catch (error) {
    console.warn('Supabase backend failed; reverting to local in-memory storage.', error);
    return fallback();
  }
}

function normalizeCategory(record: Record<string, any>): Category {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description ?? '',
    image_path: record.image_path ?? '',
    sort_order: Number(record.sort_order ?? 0),
    is_visible: record.is_visible ?? true,
    deleted_at: record.deleted_at ?? null,
    created_at: record.created_at ?? new Date().toISOString(),
  };
}

function normalizeProduct(record: Record<string, any>): Product {
  return {
    id: record.id,
    category_id: record.category_id,
    category: record.category ? normalizeCategory(record.category) : undefined,
    name: record.name,
    slug: record.slug,
    description: record.description ?? '',
    price_kobo: Number(record.price_kobo ?? 0),
    is_bespoke: Boolean(record.is_bespoke),
    is_featured: Boolean(record.is_featured),
    is_visible: record.is_visible ?? true,
    archived_at: record.archived_at ?? null,
    images: Array.isArray(record.images) ? record.images : [],
    variants: Array.isArray(record.variants) ? record.variants : [],
    created_at: record.created_at ?? new Date().toISOString(),
    updated_at: record.updated_at ?? record.created_at ?? new Date().toISOString(),
  };
}

// ==================== CATEGORIES ====================
export async function getCategories(): Promise<Category[]> {
  return withSupabaseOrLocal(async () => {
    const { data, error } = await supabase!
      .from('categories')
      .select('*')
      .eq('is_visible', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeCategory);
  }, async () => state.categories.filter((c) => c.is_visible && !c.deleted_at).sort((a, b) => a.sort_order - b.sort_order));
}

export async function getAllCategories(): Promise<Category[]> {
  return withSupabaseOrLocal(async () => {
    const { data, error } = await supabase!
      .from('categories')
      .select('*')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeCategory);
  }, async () => state.categories.filter((c) => !c.deleted_at).sort((a, b) => a.sort_order - b.sort_order));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return withSupabaseOrLocal(async () => {
    const { data, error } = await supabase!
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeCategory(data) : null;
  }, async () => {
    const cat = state.categories.find((c) => c.slug === slug && !c.deleted_at);
    return cat || null;
  });
}

export async function saveCategory(category: Partial<Category> & { name: string; slug: string }): Promise<Category> {
  const existingIndex = state.categories.findIndex((c) => c.id === category.id || c.slug === category.slug);
  if (existingIndex >= 0) {
    state.categories[existingIndex] = { ...state.categories[existingIndex], ...category };
    persistStore();
    return state.categories[existingIndex];
  } else {
    const newCat: Category = {
      id: category.id || `cat_${Date.now()}`,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_path: category.image_path || '',
      sort_order: category.sort_order || state.categories.length + 1,
      is_visible: category.is_visible ?? true,
      created_at: new Date().toISOString(),
    };
    state.categories.push(newCat);
    persistStore();
    return newCat;
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  // Check if any product belongs to this category
  const hasProducts = state.products.some((p) => p.category_id === id && !p.archived_at);
  if (hasProducts) {
    return { success: false, message: 'Cannot delete category with active products. Reassign or archive products first.' };
  }
  const idx = state.categories.findIndex((c) => c.id === id);
  if (idx >= 0) {
    state.categories[idx].deleted_at = new Date().toISOString();
    persistStore();
    return { success: true };
  }
  return { success: false, message: 'Category not found' };
}

// ==================== PRODUCTS ====================
export async function getProducts(options?: {
  categoryId?: string;
  categorySlug?: string;
  featuredOnly?: boolean;
  includeArchived?: boolean;
  searchQuery?: string;
}): Promise<Product[]> {
  return withSupabaseOrLocal(async () => {
    let query = supabase!.from('products').select('*, categories(*)');

    if (!options?.includeArchived) {
      query = query.eq('is_visible', true).is('archived_at', null);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.featuredOnly) {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    let list = (data ?? []).map((record: any) => normalizeProduct({
      ...record,
      category: record.categories,
      images: record.images ?? [],
      variants: record.variants ?? [],
    }));

    if (options?.categorySlug) {
      const match = list.filter((item) => item.category?.slug === options.categorySlug);
      list = match;
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      list = list.filter((product) => {
        const variantText = product.variants.map((variant) => variant.size_label).join(' ').toLowerCase();
        return product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q) || variantText.includes(q);
      });
    }

    return list;
  }, async () => {
    let list = [...state.products];

    if (!options?.includeArchived) {
      list = list.filter((p) => p.is_visible && !p.archived_at);
    }

    if (options?.categoryId) {
      list = list.filter((p) => p.category_id === options.categoryId);
    }

    if (options?.categorySlug) {
      const cat = state.categories.find((c) => c.slug === options.categorySlug);
      if (cat) {
        list = list.filter((p) => p.category_id === cat.id);
      } else {
        return [];
      }
    }

    if (options?.featuredOnly) {
      list = list.filter((p) => p.is_featured);
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.variants.some((v) => v.size_label.toLowerCase().includes(q))
      );
    }

    return list.map((p) => ({
      ...p,
      category: state.categories.find((c) => c.id === p.category_id),
    }));
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const prod = state.products.find((p) => p.slug === slug);
  if (!prod) return null;
  return {
    ...prod,
    category: state.categories.find((c) => c.id === prod.category_id),
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const prod = state.products.find((p) => p.id === id);
  if (!prod) return null;
  return {
    ...prod,
    category: state.categories.find((c) => c.id === prod.category_id),
  };
}

export async function saveProduct(product: Partial<Product> & { name: string; price_kobo: number }): Promise<Product> {
  const existingIndex = state.products.findIndex((p) => p.id === product.id);
  const slug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (existingIndex >= 0) {
    state.products[existingIndex] = {
      ...state.products[existingIndex],
      ...product,
      slug,
      updated_at: new Date().toISOString(),
    };
    persistStore();
    return state.products[existingIndex];
  } else {
    const newProduct: Product = {
      id: product.id || `prod_${Date.now()}`,
      category_id: product.category_id,
      name: product.name,
      slug,
      description: product.description || '',
      price_kobo: Math.max(0, Math.floor(product.price_kobo)),
      is_bespoke: product.is_bespoke || false,
      is_featured: product.is_featured || false,
      is_visible: product.is_visible ?? true,
      images: product.images || [],
      variants: product.variants || [
        { id: `var_${Date.now()}_38`, product_id: product.id || '', size_label: '38R', stock: 5 },
        { id: `var_${Date.now()}_40`, product_id: product.id || '', size_label: '40R', stock: 5 },
        { id: `var_${Date.now()}_42`, product_id: product.id || '', size_label: '42R', stock: 5 },
      ],
      created_at: new Date().toISOString(),
    };
    state.products.unshift(newProduct);
    persistStore();
    return newProduct;
  }
}

/**
 * Hard delete vs Soft delete rule from developer-note.md:
 * Products with order history are archived (soft delete), never hard-deleted.
 */
export async function deleteOrArchiveProduct(id: string): Promise<{ archived: boolean; message: string }> {
  const hasOrders = state.orders.some((o) =>
    o.items.some((item) => item.product_id === id)
  );

  const idx = state.products.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error('Product not found');
  }

  if (hasOrders) {
    state.products[idx].archived_at = new Date().toISOString();
    state.products[idx].is_visible = false;
    persistStore();
    return {
      archived: true,
      message: 'Product has previous order history and has been safely archived.',
    };
  } else {
    state.products.splice(idx, 1);
    persistStore();
    return {
      archived: false,
      message: 'Product had no order history and was permanently deleted.',
    };
  }
}

// ==================== ORDERS ====================
export async function getOrders(userId?: string): Promise<Order[]> {
  if (userId) {
    return state.orders.filter((o) => o.user_id === userId);
  }
  return [...state.orders].sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  const ord = state.orders.find((o) => o.id === id);
  return ord ? JSON.parse(JSON.stringify(ord)) : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const ord = state.orders.find((o) => o.order_number === orderNumber);
  return ord ? JSON.parse(JSON.stringify(ord)) : null;
}

export async function createOrder(orderData: Omit<Order, 'id' | 'placed_at'>): Promise<Order> {
  const newOrder: Order = {
    ...orderData,
    id: `ord_${Date.now()}`,
    placed_at: new Date().toISOString(),
  };
  state.orders.unshift(newOrder);
  persistStore();
  return newOrder;
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  trackingUrl?: string,
  internalNote?: string
): Promise<Order> {
  const order = state.orders.find((o) => o.order_number === orderNumber);
  if (!order) throw new Error('Order not found');

  const before = { status: order.status, tracking_url: order.tracking_url };
  order.status = status;
  if (trackingUrl !== undefined) order.tracking_url = trackingUrl;
  if (internalNote !== undefined) order.internal_note = internalNote;

  addAuditLog({
    actor_email: 'henryaplus82@gmail.com',
    action: 'order.status_update',
    entity: 'orders',
    entity_id: order.id,
    before,
    after: { status, tracking_url: order.tracking_url },
  });

  persistStore();
  return order;
}

// ==================== PAYMENTS ====================
export async function recordPaymentSuccess(orderNumber: string, reference: string, channel: string, amountKobo: number) {
  const order = state.orders.find((o) => o.order_number === orderNumber);
  if (!order) return null;

  order.status = 'paid';
  order.payment = {
    reference,
    order_id: order.id,
    provider: 'paystack',
    channel,
    amount_kobo: amountKobo,
    status: 'success',
    refund_status: 'none',
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  // Decrement variant stock
  for (const item of order.items) {
    if (item.product_id && item.variant_id) {
      const prod = state.products.find((p) => p.id === item.product_id);
      if (prod) {
        const variant = prod.variants.find((v) => v.id === item.variant_id);
        if (variant && variant.stock > 0) {
          variant.stock = Math.max(0, variant.stock - item.qty);
        }
      }
    }
  }

  addAuditLog({
    actor_email: 'system.paystack_webhook',
    action: 'payment.charge_success',
    entity: 'orders',
    entity_id: order.id,
    before: { status: 'pending' },
    after: { status: 'paid', reference, amount_kobo: amountKobo },
  });

  persistStore();
  return order;
}

// ==================== QUOTES ====================
export async function getQuotes(): Promise<Quote[]> {
  return [...state.quotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getQuoteByReference(reference: string): Promise<Quote | null> {
  const q = state.quotes.find((item) => item.reference === reference);
  return q || null;
}

export async function createQuote(quoteData: Omit<Quote, 'id' | 'created_at'>): Promise<Quote> {
  return withSupabaseOrLocal(async () => {
    const payload = {
      ...quoteData,
      id: `quote_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase!.from('quotes').insert(payload).select().single();
    if (error) throw error;
    return data as Quote;
  }, async () => {
    const newQuote: Quote = {
      ...quoteData,
      id: `quote_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    state.quotes.unshift(newQuote);
    persistStore();
    return newQuote;
  });
}

export async function replyQuote(
  reference: string,
  quotedPriceKobo: number,
  readyBy: string,
  ownerMessage: string
): Promise<Quote> {
  const q = state.quotes.find((item) => item.reference === reference);
  if (!q) throw new Error('Quote not found');

  q.status = 'quote_sent';
  q.quoted_price_kobo = quotedPriceKobo;
  q.ready_by = readyBy;
  q.owner_message = ownerMessage;

  addAuditLog({
    actor_email: 'henryaplus82@gmail.com',
    action: 'quote.reply',
    entity: 'quotes',
    entity_id: q.id,
    before: { status: 'requested' },
    after: { status: 'quote_sent', quoted_price_kobo: quotedPriceKobo, ready_by: readyBy },
  });

  persistStore();
  return q;
}

export async function updateQuoteStatus(reference: string, status: QuoteStatus): Promise<Quote> {
  const q = state.quotes.find((item) => item.reference === reference);
  if (!q) throw new Error('Quote not found');
  q.status = status;
  persistStore();
  return q;
}

// ==================== BOOKINGS ====================
export async function getBookings(): Promise<Booking[]> {
  return [...state.bookings].sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  return withSupabaseOrLocal(async () => {
    const payload = {
      ...bookingData,
      id: `bk_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase!.from('bookings').insert(payload).select().single();
    if (error) throw error;
    return data as Booking;
  }, async () => {
    const newBooking: Booking = {
      ...bookingData,
      id: `bk_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    state.bookings.unshift(newBooking);
    persistStore();
    return newBooking;
  });
}

export async function updateBookingStatus(
  reference: string,
  status: BookingStatus,
  newStartsAt?: string
): Promise<Booking> {
  const b = state.bookings.find((item) => item.reference === reference);
  if (!b) throw new Error('Booking not found');

  const before = { status: b.status, starts_at: b.starts_at };
  b.status = status;
  if (newStartsAt) b.starts_at = newStartsAt;

  addAuditLog({
    actor_email: 'henryaplus82@gmail.com',
    action: 'booking.status_update',
    entity: 'bookings',
    entity_id: b.id,
    before,
    after: { status: b.status, starts_at: b.starts_at },
  });

  persistStore();
  return b;
}

// ==================== REVIEWS ====================
export async function getReviews(productId?: string, approvedOnly = true): Promise<Review[]> {
  return withSupabaseOrLocal(async () => {
    let query = supabase!.from('reviews').select('*');
    if (productId) query = query.eq('product_id', productId);
    if (approvedOnly) query = query.eq('status', 'approved');

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((record: any) => ({
      ...record,
      rating: Number(record.rating),
    }));
  }, async () => {
    let list = [...state.reviews];
    if (productId) {
      list = list.filter((r) => r.product_id === productId);
    }
    if (approvedOnly) {
      list = list.filter((r) => r.status === 'approved');
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
}

export async function createReview(reviewData: Omit<Review, 'id' | 'created_at' | 'status'>): Promise<Review> {
  const newRev: Review = {
    ...reviewData,
    id: `rev_${Date.now()}`,
    status: 'under_review',
    created_at: new Date().toISOString(),
  };
  state.reviews.unshift(newRev);
  persistStore();
  return newRev;
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<Review> {
  const rev = state.reviews.find((r) => r.id === id);
  if (!rev) throw new Error('Review not found');
  rev.status = status;

  addAuditLog({
    actor_email: 'henryaplus82@gmail.com',
    action: 'review.moderate',
    entity: 'reviews',
    entity_id: id,
    after: { status },
  });

  persistStore();
  return rev;
}

export async function deleteReview(id: string): Promise<boolean> {
  const idx = state.reviews.findIndex((r) => r.id === id);
  if (idx >= 0) {
    state.reviews.splice(idx, 1);
    addAuditLog({
      actor_email: 'henryaplus82@gmail.com',
      action: 'review.delete',
      entity: 'reviews',
      entity_id: id,
    });
    persistStore();
    return true;
  }
  return false;
}

// ==================== STORE SETTINGS ====================
export async function getStoreSettings(): Promise<StoreSettings> {
  return JSON.parse(JSON.stringify(state.settings));
}

export async function updateStoreSettings<K extends keyof StoreSettings>(
  key: K,
  value: StoreSettings[K]
): Promise<StoreSettings> {
  state.settings[key] = value;
  addAuditLog({
    actor_email: 'henryaplus82@gmail.com',
    action: 'settings.update',
    entity: 'store_settings',
    entity_id: key as string,
    after: { [key]: value },
  });
  persistStore();
  return JSON.parse(JSON.stringify(state.settings));
}

// ==================== AUDIT LOGS ====================
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return [...state.auditLogs].sort((a, b) => b.id - a.id);
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): void {
  const nextId = state.auditLogs.length ? Math.max(...state.auditLogs.map((l) => l.id)) + 1 : 1;
  state.auditLogs.unshift({
    ...entry,
    id: nextId,
    created_at: new Date().toISOString(),
  });
  persistStore();
}
