-- A-Plus Fashion Home Database Schema Migration
-- Designed for Supabase / PostgreSQL

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS & ROLES
-- Role: customer | owner
-- Order Status: pending | paid | processing | shipped | delivered | cancelled
-- Payment Status: initialized | pending | success | failed | abandoned
-- Refund Status: none | partial | full | pending
-- Review Status: under_review | approved | hidden
-- Quote Status: requested | quote_sent | accepted | rejected
-- Booking Status: requested | confirmed | rescheduled | rejected | cancelled

-- 3. PROFILES (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  phone text,
  country text default 'Nigeria',
  role text default 'customer' check (role in ('customer', 'owner')),
  welcome_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. ADMINS (Allow-list)
create table if not exists public.admins (
  email text primary key,
  user_id uuid references auth.users on delete set null,
  added_by text,
  created_at timestamptz default now()
);

-- 5. CATEGORIES
create table if not exists public.categories (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  slug text unique not null,
  description text,
  image_path text,
  sort_order int default 0,
  is_visible boolean default true,
  deleted_at timestamptz null,
  created_at timestamptz default now()
);

-- 6. PRODUCTS
create table if not exists public.products (
  id text primary key default uuid_generate_v4()::text,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price_kobo bigint not null check (price_kobo >= 0),
  is_bespoke boolean default false,
  is_featured boolean default false,
  is_visible boolean default true,
  archived_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. PRODUCT IMAGES
create table if not exists public.product_images (
  id text primary key default uuid_generate_v4()::text,
  product_id text not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order int default 0,
  is_cover boolean default false,
  created_at timestamptz default now()
);

-- 8. PRODUCT VARIANTS (Sizes + Stock)
create table if not exists public.product_variants (
  id text primary key default uuid_generate_v4()::text,
  product_id text not null references public.products(id) on delete cascade,
  size_label text not null,
  sku text,
  stock int not null default 0 check (stock >= 0),
  created_at timestamptz default now()
);

-- 9. CARTS & CART ITEMS
create table if not exists public.carts (
  id text primary key default uuid_generate_v4()::text,
  user_id uuid references auth.users on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cart_items (
  id text primary key default uuid_generate_v4()::text,
  cart_id text not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  variant_id text not null references public.product_variants(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  fit_type text default 'ready_to_wear' check (fit_type in ('ready_to_wear', 'bespoke')),
  created_at timestamptz default now()
);

-- 10. ORDERS
create table if not exists public.orders (
  id text primary key default uuid_generate_v4()::text,
  order_number text unique not null,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal_kobo bigint not null check (subtotal_kobo >= 0),
  delivery_fee_kobo bigint not null default 0 check (delivery_fee_kobo >= 0),
  total_kobo bigint not null check (total_kobo >= 0),
  currency text not null default 'NGN',
  shipping_address jsonb not null,
  tracking_url text,
  internal_note text,
  confirmation_sent_at timestamptz,
  placed_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. ORDER ITEMS (Snapshots of what was bought)
create table if not exists public.order_items (
  id text primary key default uuid_generate_v4()::text,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  variant_id text references public.product_variants(id) on delete set null,
  name_snapshot text not null,
  size_snapshot text not null,
  fit_type text default 'ready_to_wear',
  unit_price_kobo bigint not null check (unit_price_kobo >= 0),
  qty int not null check (qty > 0),
  line_total_kobo bigint not null check (line_total_kobo >= 0),
  image_snapshot text,
  created_at timestamptz default now()
);

-- 12. PAYMENTS
create table if not exists public.payments (
  reference text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null default 'paystack',
  channel text,
  amount_kobo bigint not null check (amount_kobo >= 0),
  status text not null default 'initialized' check (status in ('initialized', 'pending', 'success', 'failed', 'abandoned')),
  refund_status text not null default 'none' check (refund_status in ('none', 'partial', 'full', 'pending')),
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- 13. REFUNDS
create table if not exists public.refunds (
  id text primary key default uuid_generate_v4()::text,
  payment_id text not null references public.payments(reference) on delete cascade,
  amount_kobo bigint not null check (amount_kobo >= 0),
  reason text,
  paystack_refund_id text,
  status text not null default 'pending',
  created_by text,
  created_at timestamptz default now()
);

-- 14. QUOTES
create table if not exists public.quotes (
  id text primary key default uuid_generate_v4()::text,
  reference text unique not null,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  garment text not null,
  occasion text not null,
  event_date text,
  budget_min_kobo bigint,
  budget_max_kobo bigint,
  notes text,
  photo_paths text[] default '{}',
  contact_preference text default 'WhatsApp',
  status text not null default 'requested' check (status in ('requested', 'quote_sent', 'accepted', 'rejected')),
  quoted_price_kobo bigint,
  ready_by text,
  owner_message text,
  received_email_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 15. BOOKINGS
create table if not exists public.bookings (
  id text primary key default uuid_generate_v4()::text,
  reference text unique not null,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  type text not null default 'shop' check (type in ('shop', 'video')),
  starts_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'rescheduled', 'rejected', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. REVIEWS
create table if not exists public.reviews (
  id text primary key default uuid_generate_v4()::text,
  product_id text references public.products(id) on delete set null,
  user_id uuid references auth.users on delete set null,
  author_name text not null,
  author_location text default 'Nigeria',
  rating int not null check (rating >= 1 and rating <= 5),
  body text not null,
  status text not null default 'under_review' check (status in ('under_review', 'approved', 'hidden')),
  created_at timestamptz default now()
);

-- 17. CONTACT MESSAGES
create table if not exists public.contact_messages (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  handled boolean default false,
  created_at timestamptz default now()
);

-- 18. STORE SETTINGS
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  draft_value jsonb null,
  updated_by text,
  updated_at timestamptz default now()
);

-- 19. AUDIT LOG
create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  actor_email text not null,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now()
);

-- 20. SECURITY DEFINER HELPER: is_admin()
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
      or exists (select 1 from public.admins a where lower(a.email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 21. TRIGGER FOR NEW USER (auth.users -> profiles)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 22. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.quotes enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.store_settings enable row level security;
alter table public.audit_log enable row level security;

-- Public read policies
create policy "public categories" on public.categories for select using (is_visible and deleted_at is null);
create policy "public products" on public.products for select using (is_visible and archived_at is null);
create policy "public product images" on public.product_images for select using (true);
create policy "public product variants" on public.product_variants for select using (true);
create policy "public approved reviews" on public.reviews for select using (status = 'approved');
create policy "public store settings" on public.store_settings for select using (true);

-- Customer policies
create policy "own profile select" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "own orders select" on public.orders for select using (user_id = auth.uid());
create policy "own order items select" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "own quotes select" on public.quotes for select using (user_id = auth.uid());
create policy "own bookings select" on public.bookings for select using (user_id = auth.uid());

-- Admin full access policies via is_admin()
create policy "admin categories all" on public.categories for all using (is_admin()) with check (is_admin());
create policy "admin products all" on public.products for all using (is_admin()) with check (is_admin());
create policy "admin product images all" on public.product_images for all using (is_admin()) with check (is_admin());
create policy "admin product variants all" on public.product_variants for all using (is_admin()) with check (is_admin());
create policy "admin orders all" on public.orders for all using (is_admin()) with check (is_admin());
create policy "admin order items all" on public.order_items for all using (is_admin()) with check (is_admin());
create policy "admin payments select" on public.payments for select using (is_admin());
create policy "admin refunds all" on public.refunds for all using (is_admin()) with check (is_admin());
create policy "admin quotes all" on public.quotes for all using (is_admin()) with check (is_admin());
create policy "admin bookings all" on public.bookings for all using (is_admin()) with check (is_admin());
create policy "admin reviews all" on public.reviews for all using (is_admin()) with check (is_admin());
create policy "admin contact messages all" on public.contact_messages for all using (is_admin()) with check (is_admin());
create policy "admin store settings all" on public.store_settings for all using (is_admin()) with check (is_admin());
create policy "admin audit log select" on public.audit_log for select using (is_admin());
