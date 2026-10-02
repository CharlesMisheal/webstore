export type UserRole = 'customer' | 'owner';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  country: string;
  role: UserRole;
  welcome_sent_at?: string | null;
  measurements?: Measurements | null;
  created_at: string;
}

export interface Measurements {
  chest?: string;
  waist?: string;
  shoulder?: string;
  sleeve?: string;
  height?: string;
  notes?: string;
}

/** Admin "Customers" list row: a profile, or a guest grouped by email. */
export interface CustomerSummary {
  id: string; // profile id, or `guest:<email>`
  user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  is_guest: boolean;
  order_count: number;
  total_spent_kobo: number;
  last_order_at?: string | null;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_path?: string;
  sort_order: number;
  is_visible: boolean;
  deleted_at?: string | null;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_label: string;
  sku?: string;
  stock: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt?: string;
  sort_order: number;
  is_cover: boolean;
}

export interface Product {
  id: string;
  category_id?: string;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  price_kobo: number; // integer kobo (e.g. 15000000 = ₦150,000)
  is_bespoke: boolean;
  is_featured: boolean;
  is_visible: boolean;
  archived_at?: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export type FitType = 'ready_to_wear' | 'bespoke';

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  name: string;
  size_label: string;
  fit_type: FitType;
  unit_price_kobo: number;
  qty: number;
  image_url: string;
  slug: string;
}

export interface Cart {
  items: CartItem[];
  subtotal_kobo: number;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  deliveryOptionId: string;
  deliveryMethod: string;
  deliveryNotes?: string;
}

export interface OrderItemSnapshot {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  name_snapshot: string;
  size_snapshot: string;
  fit_type: FitType;
  unit_price_kobo: number;
  qty: number;
  line_total_kobo: number;
  image_snapshot?: string;
}

export interface Order {
  id: string;
  order_number: string; // APF-YYMMDD-####
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: OrderStatus;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  total_kobo: number;
  currency: 'NGN' | 'USD' | 'GBP';
  shipping_address: ShippingAddress;
  tracking_url?: string | null;
  internal_note?: string | null;
  confirmation_sent_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  placed_at: string;
  updated_at?: string;
  items: OrderItemSnapshot[];
  /** Most relevant payment attempt: the successful one if any, else the latest. */
  payment?: Payment;
  /** Every Paystack attempt for this order (retries create new references). */
  payments?: Payment[];
}

export type PaymentStatus = 'initialized' | 'pending' | 'success' | 'failed' | 'abandoned';
export type RefundStatus = 'none' | 'partial' | 'full' | 'pending';

export interface Payment {
  reference: string;
  order_id: string;
  provider: 'paystack';
  channel?: string;
  amount_kobo: number;
  status: PaymentStatus;
  refund_status: RefundStatus;
  raw?: Record<string, unknown>;
  paid_at?: string;
  created_at: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount_kobo: number;
  reason?: string;
  paystack_refund_id?: string;
  status: string;
  created_by?: string;
  created_at: string;
}

export type QuoteStatus = 'requested' | 'quote_sent' | 'accepted' | 'rejected';

export interface Quote {
  id: string;
  reference: string; // QT-YYMMDD-####
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  garment: string;
  occasion: string;
  event_date?: string;
  budget_min_kobo?: number;
  budget_max_kobo?: number;
  notes?: string;
  photo_paths: string[];
  contact_preference: 'WhatsApp' | 'Email' | 'Phone';
  status: QuoteStatus;
  quoted_price_kobo?: number | null;
  ready_by?: string | null;
  owner_message?: string | null;
  reply_sent_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export type BookingStatus = 'requested' | 'confirmed' | 'rescheduled' | 'rejected' | 'cancelled';
export type BookingType = 'shop' | 'video';

export interface Booking {
  id: string;
  reference: string; // BK-YYMMDD-####
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  type: BookingType;
  starts_at: string;
  status: BookingStatus;
  notes?: string;
  created_at: string;
}

export type ReviewStatus = 'under_review' | 'approved' | 'hidden';

export interface Review {
  id: string;
  product_id?: string;
  product_name?: string;
  user_id?: string | null;
  author_name: string;
  author_location?: string;
  rating: number; // 1-5
  body: string;
  status: ReviewStatus;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface HomepageBanner {
  id: string;
  headline: string;
  sub: string;
  cta_label: string;
  cta_href: string;
  secondary_label?: string;
  secondary_href?: string;
  image_path: string;
  visible: boolean;
  sort_order: number;
}

export interface DeliveryRule {
  id: string;
  label: string;
  fee_kobo: number;
  eta: string;
}

export type StoreSettingKey = keyof StoreSettings;

/** Shopper-selected display currency. Charges are always made in NGN. */
export type DisplayCurrency = 'NGN' | 'USD' | 'GBP';

/** Admin view of one settings row: published value plus optional unpublished draft. */
export interface StoreSettingRow<K extends StoreSettingKey = StoreSettingKey> {
  key: K;
  value: StoreSettings[K];
  draft_value: StoreSettings[K] | null;
  updated_by?: string | null;
  updated_at?: string;
}

export interface StoreSettings {
  homepage_banners: HomepageBanner[];
  about: {
    headline: string;
    story_html: string;
    years: number;
    product_count: string;
    happy_clients: string;
  };
  contact: {
    whatsapp: string;
    phone: string;
    alt_phone?: string;
    email: string;
    address: string;
    hours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    whatsapp_channel: string;
  };
  fx_rates: {
    USD: number; // e.g. 1550 NGN per USD
    GBP: number; // e.g. 1980 NGN per GBP
  };
  delivery_rules: DeliveryRule[];
}

export interface AuditLogEntry {
  id: number;
  actor_id?: string | null;
  actor_email: string;
  action: string;
  entity: string;
  entity_id?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  user_agent?: string;
  created_at: string;
}
