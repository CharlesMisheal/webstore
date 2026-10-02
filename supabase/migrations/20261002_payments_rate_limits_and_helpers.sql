-- A-Plus Fashion Home — Migration 2
-- Adds: atomic paid-order claim, stock decrement, rate limiting, saved
-- measurements, public settings view (hides draft_value), useful indexes.
-- Safe to run more than once.

-- 1. PROFILES: saved bespoke measurements
alter table public.profiles add column if not exists measurements jsonb;

-- 2. ORDERS: cancellation metadata
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;

-- 3. QUOTES: track reply email
alter table public.quotes add column if not exists reply_sent_at timestamptz;

-- 4. RATE LIMITS (fixed-window counters keyed by e.g. "contact:1.2.3.4")
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);
alter table public.rate_limits enable row level security;
-- No policies: only the service role (server code) touches this table.

create or replace function public.consume_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := now();
  v_row public.rate_limits%rowtype;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set count = case
                  when public.rate_limits.window_start + make_interval(secs => p_window_seconds) < v_now then 1
                  else public.rate_limits.count + 1
                end,
        window_start = case
                  when public.rate_limits.window_start + make_interval(secs => p_window_seconds) < v_now then v_now
                  else public.rate_limits.window_start
                end
  returning * into v_row;

  return v_row.count <= p_limit;
end;
$$;
revoke all on function public.consume_rate_limit(text, int, int) from public;

-- 5. ATOMIC "MARK PAID ONCE"
-- Claims the payment row (status <> 'success'), marks the order paid and
-- decrements variant stock in a single transaction. Returns the order id if
-- this call performed the transition, or null if it was already processed.
create or replace function public.apply_paid_order(
  p_reference text,
  p_channel text,
  p_amount_kobo bigint,
  p_raw jsonb
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_order_id text;
  v_item record;
begin
  update public.payments
     set status = 'success',
         channel = coalesce(p_channel, channel),
         amount_kobo = p_amount_kobo,
         raw = p_raw,
         paid_at = coalesce(paid_at, now())
   where reference = p_reference
     and status <> 'success'
  returning order_id into v_order_id;

  if v_order_id is null then
    return null; -- already processed (idempotent) or unknown reference
  end if;

  update public.orders
     set status = 'paid', updated_at = now()
   where id = v_order_id
     and status = 'pending';

  -- Only ready-to-wear lines consume stock; bespoke pieces are made to order.
  for v_item in
    select variant_id, qty from public.order_items
     where order_id = v_order_id and variant_id is not null and fit_type = 'ready_to_wear'
  loop
    update public.product_variants
       set stock = greatest(0, stock - v_item.qty)
     where id = v_item.variant_id;
  end loop;

  return v_order_id;
end;
$$;
revoke all on function public.apply_paid_order(text, text, bigint, jsonb) from public;

-- 6. CLAIM "SEND CONFIRMATION EMAIL ONCE"
create or replace function public.claim_order_confirmation(p_order_id text)
returns boolean
language sql security definer set search_path = public as $$
  with claimed as (
    update public.orders
       set confirmation_sent_at = now()
     where id = p_order_id and confirmation_sent_at is null
    returning id
  )
  select exists (select 1 from claimed);
$$;
revoke all on function public.claim_order_confirmation(text) from public;

-- 7. CLAIM "SEND WELCOME EMAIL ONCE"
create or replace function public.claim_welcome_email(p_user_id uuid)
returns boolean
language sql security definer set search_path = public as $$
  with claimed as (
    update public.profiles
       set welcome_sent_at = now()
     where id = p_user_id and welcome_sent_at is null
    returning id
  )
  select exists (select 1 from claimed);
$$;
revoke all on function public.claim_welcome_email(uuid) from public;

-- 8. STORE SETTINGS: public view exposes only the published value, never draft_value
drop policy if exists "public store settings" on public.store_settings;
create or replace view public.store_settings_public as
  select key, value, updated_at from public.store_settings;
grant select on public.store_settings_public to anon, authenticated;

-- 9. INDEXES
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));
create index if not exists orders_placed_at_idx on public.orders (placed_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists product_images_product_id_idx on public.product_images (product_id, sort_order);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists reviews_product_status_idx on public.reviews (product_id, status);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists quotes_status_idx on public.quotes (status);
create index if not exists bookings_starts_at_idx on public.bookings (starts_at);
