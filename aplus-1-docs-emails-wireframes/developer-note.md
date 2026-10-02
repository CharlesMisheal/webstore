# Developer note — A-Plus Fashion Home

Stack assumed: **Next.js (App Router, TypeScript) · Supabase (Postgres, Auth with Google, Storage, RLS) · Paystack · Mailgun**. All sample values (prices, references, addresses) are placeholders.

---
## 1. Data model (Postgres / Supabase)

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | 1:1 with `auth.users`; created by trigger on first Google sign-in | `id uuid pk → auth.users`, `full_name`, `email`, `phone`, `country`, `role text default 'customer' check (role in ('customer','owner'))`, `created_at` |
| `admins` | Optional explicit allow-list (alternative to `profiles.role`) | `email text pk`, `user_id uuid null`, `added_by`, `created_at` |
| `categories` | Store menu | `id`, `name`, `slug unique`, `image_path`, `sort_order int`, `is_visible bool`, `deleted_at` |
| `products` | Catalogue | `id`, `category_id → categories`, `name`, `slug unique`, `description`, `price_kobo bigint`, `is_visible bool default true`, `archived_at timestamptz null` (soft delete), `created_at`, `updated_at` |
| `product_images` | Gallery | `id`, `product_id`, `storage_path`, `alt`, `sort_order`, `is_cover` |
| `product_variants` | Sizes + stock | `id`, `product_id`, `size_label`, `sku`, `stock int check (stock >= 0)` |
| `carts`, `cart_items` | Persistent cart (guest cart merged after login) | `cart_items(cart_id, variant_id, qty, fit_type)` |
| `orders` | Order header | `id`, `order_number unique` (APF-YYMMDD-####), `user_id`, `status` (`pending, paid, processing, shipped, delivered, cancelled`), `subtotal_kobo`, `delivery_fee_kobo`, `total_kobo`, `currency default 'NGN'`, `shipping_address jsonb`, `tracking_url`, `internal_note`, `placed_at` |
| `order_items` | **Snapshot** of what was bought | `order_id`, `product_id` (nullable FK, `on delete set null`), `variant_id`, `name_snapshot`, `size_snapshot`, `unit_price_kobo`, `qty`, `image_snapshot` |
| `payments` | One row per Paystack attempt | `id`, `order_id`, `reference unique`, `provider 'paystack'`, `channel`, `amount_kobo`, `status` (`initialized, pending, success, failed, abandoned`), `refund_status` (`none, partial, full, pending`), `raw jsonb`, `paid_at` |
| `refunds` | Refund requests / results | `id`, `payment_id`, `amount_kobo`, `reason`, `paystack_refund_id`, `status`, `created_by`, `created_at` |
| `quotes` | Quotation requests | `id`, `reference` (QT-…), `user_id`, `garment`, `occasion`, `event_date`, `budget_min_kobo`, `budget_max_kobo`, `notes`, `photo_paths text[]`, `status` (`requested, quote_sent, accepted, rejected`), `quoted_price_kobo`, `ready_by`, `owner_message` |
| `bookings` | Fitting bookings | `id`, `reference` (BK-…), `user_id`, `type` (`shop, video`), `starts_at timestamptz`, `status` (`requested, confirmed, rescheduled, rejected, cancelled`), `notes` |
| `reviews` | Customer reviews | `id`, `product_id`, `user_id`, `rating 1–5`, `body`, `status` (`under_review, approved, hidden`), `created_at` |
| `contact_messages` | Contact form | `id`, `name`, `email`, `message`, `handled bool` |
| `store_settings` | **Owner-editable content** (key/value JSONB) | `key text pk`, `value jsonb`, `draft_value jsonb null`, `updated_by`, `updated_at` |
| `audit_log` | Who changed what | `id bigserial`, `actor_id`, `actor_email`, `action` (e.g. `order.status_update`), `entity` (`orders`), `entity_id`, `before jsonb`, `after jsonb`, `ip inet`, `user_agent`, `created_at` |

Money is stored as **integer kobo** (NGN × 100). USD/GBP are display-only estimates from a rate in `store_settings` (`fx_rates`); the Paystack charge is always NGN unless the account has USD enabled.

`store_settings` keys: `homepage_banners` (array of `{id, image_path, headline, sub, cta_label, cta_href, visible, sort_order}`), `about` (`{headline, story_html, years, product_count}`), `contact` (`{whatsapp, phone, email, address, hours}`), `social` (`{instagram, facebook, tiktok, whatsapp_channel}`), `fx_rates`, `delivery_rules`. Public pages read only the published `value`; the admin “Save draft / Publish” writes `draft_value` then promotes it.

---
## 2. Admin data model & permissions

### 2.1 Who is an admin
Pick **one** source of truth (both are shown in the schema):
- **Option A (simplest):** `profiles.role = 'owner'`. Set manually in SQL for Henry’s account; never writable from the client.
- **Option B:** `admins` table keyed by email (allows adding a second staff member later).

```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
      or exists (select 1 from admins a where lower(a.email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_admin() from public; grant execute on function public.is_admin() to authenticated;
```
Also keep an env allow-list as a belt-and-braces check for the first login: `ADMIN_EMAILS=owner@example.com` (**TBD — owner’s email to be confirmed**). Require `email_verified = true` from Google.

### 2.2 Row Level Security (enable RLS on every table)
```sql
-- customer-owned data
create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own profile update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid())); -- cannot self-promote
create policy "own orders" on orders for select using (user_id = auth.uid());
create policy "own order items" on order_items for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own quotes" on quotes for select using (user_id = auth.uid());
create policy "own bookings" on bookings for select using (user_id = auth.uid());

-- public catalogue
create policy "public products" on products for select using (is_visible and archived_at is null);
create policy "public categories" on categories for select using (is_visible and deleted_at is null);
create policy "public approved reviews" on reviews for select using (status = 'approved');
create policy "public settings" on store_settings for select using (true);   -- exposes only `value`, never `draft_value` (use a view)

-- admin: full access through is_admin()
create policy "admin all products" on products for all using (is_admin()) with check (is_admin());
-- repeat for categories, product_images, product_variants, orders, order_items, payments, refunds, quotes, bookings, reviews, contact_messages, store_settings, profiles(select)
create policy "admin read audit" on audit_log for select using (is_admin());
-- audit_log: NO insert/update/delete policy for users; writes only by service role in server code (append-only)
```
`payments`, `refunds` and `audit_log` have **no** client write policies at all. Payment rows are written only by server code with the service-role key (webhook / initialize route).

### 2.3 Server-side authorization on **every** admin route
UI hiding is not security. Every `/admin/*` page, server action and `/api/admin/*` route handler calls one helper before doing anything:
```ts
// lib/admin-guard.ts
import { createServerClient } from '@/lib/supabase/server';
export async function requireAdmin() {
  const supabase = await createServerClient();             // cookie session
  const { data: { user } } = await supabase.auth.getUser(); // validates JWT with Supabase (not getSession)
  if (!user || user.user_metadata?.email_verified !== true) throw new HttpError(401); // Google must report a verified email
  const { data: ok } = await supabase.rpc('is_admin');
  const allow = (process.env.ADMIN_EMAILS ?? '').toLowerCase().split(',');
  if (!ok || !allow.includes(user.email!.toLowerCase())) throw new HttpError(403);
  return user;
}
```
- `middleware.ts` also redirects unauthenticated `/admin/*` to `/admin/login` (UX only; the handler check is the real gate).
- Non-owners signing in through Google at `/admin/login` are **signed out** and shown the “Access denied” state (see `10-admin-desktop-01-login.png` / mobile login denied).
- **Session timeout:** idle timeout 30 min (sliding), absolute max 8 h for admin; implement with a short-lived `admin_session_at` cookie checked in `requireAdmin()` + client countdown (“Session ends in 28:10”). Re-auth (fresh Google sign-in) before refunds.
- All admin mutations: validate input with Zod, CSRF-safe (SameSite=Lax cookies + Origin check on POST), rate-limit refund/delete endpoints, and write an `audit_log` row **in the same transaction**.
- Service-role key is used only in server code, never exposed (`SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix).

### 2.4 Audit log
```sql
create table audit_log (
  id bigserial primary key, actor_id uuid, actor_email text not null,
  action text not null, entity text not null, entity_id text,
  before jsonb, after jsonb, ip inet, user_agent text, created_at timestamptz default now()
);
alter table audit_log enable row level security;
```
Log: product create/update/archive/delete, price & stock changes, category rename/reorder/delete, order status changes, refunds, quote replies/accept/reject, booking reschedule, review approve/hide/delete, store content publish, admin sign-in and failed admin sign-in. The Activity card in the order detail screen reads from this table.

### 2.5 Soft delete for products with order history
`order_items` keeps snapshots, so history stays correct. Delete logic:
```ts
const { count } = await sb.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
if (count) await sb.from('products').update({ archived_at: new Date(), is_visible: false }).eq('id', id); // archive
else await sb.from('products').delete().eq('id', id);                                                     // hard delete
```
The confirm dialog tells the owner which will happen (“Products with order history are archived instead”). Archived products are hidden from the store and the default admin list (filter “Archived” shows them; “Restore” sets `archived_at = null`). Categories with products cannot be deleted (move products first).

### 2.6 Image storage bucket
- Bucket `product-images` (public read, so the CDN can serve it) with path `products/{product_id}/{uuid}.webp`; `store-content` for banners/About; **private** bucket `quote-uploads` (customer reference photos) served via signed URLs.
- Storage policies: public `select` on `product-images`/`store-content`; `insert/update/delete` only `is_admin()`. `quote-uploads`: authenticated users insert into their own folder `{auth.uid()}/…`; admin reads.
- Upload limits: 5 MB, JPEG/PNG/WebP only (check MIME by magic bytes server-side); generate 3 sizes (400/800/1600 px) via Next.js Image or an Edge Function; store `sort_order` for the drag-reorder UI and `is_cover` for the first image.

### 2.7 Admin routes → tables (CRUD map)
| Screen | Route | Reads | Writes (all audit-logged) |
|---|---|---|---|
| Dashboard | `/admin` | orders, order_items, variants, quotes, bookings | — |
| Products | `/admin/products`, `/new`, `/[id]` | products, images, variants | create/update/archive/delete, bulk show/hide, reorder images |
| Categories | `/admin/categories` | categories | create, rename, reorder, toggle, delete |
| Orders | `/admin/orders`, `/[id]`, `/[id]/invoice` | orders, items, payments | status update (+ tracking link, email), cancel/refund |
| Payments | `/admin/payments` | payments, refunds | refund via Paystack API |
| Customers | `/admin/customers`, `/[id]` | profiles, orders | — (read-only; export CSV) |
| Quotes & bookings | `/admin/requests` | quotes, bookings | reply, accept, reject, reschedule (+ Mailgun/WhatsApp message) |
| Reviews | `/admin/reviews` | reviews | approve, hide, delete |
| Store content | `/admin/content` | store_settings | save draft, publish, preview |

---
## 3. Auth: Supabase + Google
1. Google Cloud console → OAuth client (Web). Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`. Add Client ID/Secret in Supabase → Auth → Providers → Google.
2. Next.js: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${SITE_URL}/auth/callback` } })`; callback route exchanges the code (`exchangeCodeForSession`).
3. **Profile trigger** (first sign-in):
```sql
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles (id, email, full_name) values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  perform net.http_post(url := current_setting('app.welcome_webhook'), body := jsonb_build_object('user_id', new.id)); -- or use a Database Webhook
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
```
The webhook hits `/api/hooks/welcome` (verified with a shared secret) which sends the welcome email once.

---
## 4. Paystack

Env vars (`.env.local`; test keys first):
```
PAYSTACK_SECRET_KEY=sk_test_xxx        # server only
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_SITE_URL=https://YOURDOMAIN.com
SUPABASE_SERVICE_ROLE_KEY=...          # server only
MAILGUN_API_KEY=...  MAILGUN_DOMAIN=mg.YOURDOMAIN.com  MAILGUN_FROM="A-Plus Fashion Home <orders@mg.YOURDOMAIN.com>"
ADMIN_EMAILS=owner@example.com         # TBD
```
**Flow:** create order (`pending`) → `POST /api/pay/initialize` → redirect to `authorization_url` → customer pays → Paystack redirects to `/order/[number]/confirmation?reference=…` (read-only status page) and **independently** calls our webhook → webhook marks paid. Never trust the redirect alone.

```ts
// app/api/pay/initialize/route.ts
export async function POST(req: Request) {
  const user = await requireUser(); const { orderId } = schema.parse(await req.json());
  const order = await getOwnOrder(orderId, user.id);                       // amount comes from DB, never from the client
  const reference = `APF-${order.order_number}-${Date.now().toString(36)}`; // unique per attempt (retry = new reference)
  const r = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, amount: order.total_kobo, currency: 'NGN', reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/${order.order_number}/confirmation`,
      channels: ['card','bank','ussd','bank_transfer'], metadata: { order_id: order.id, order_number: order.order_number } }) });
  const { data } = await r.json();
  await admin.from('payments').insert({ order_id: order.id, reference, amount_kobo: order.total_kobo, status: 'initialized' });
  return Response.json({ url: data.authorization_url });
}
```
```ts
// app/api/paystack/webhook/route.ts
import crypto from 'crypto';
export async function POST(req: Request) {
  const raw = await req.text();                                             // raw body is required for the HMAC
  const sig = req.headers.get('x-paystack-signature') ?? '';
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(raw).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sig.padEnd(hash.length)))) return new Response('bad signature', { status: 401 });
  const evt = JSON.parse(raw);
  switch (evt.event) {
    case 'charge.success': await markPaidOnce(evt.data); break;            // idempotent
    case 'charge.failed':  await markFailed(evt.data.reference); break;
    case 'refund.processed': case 'refund.failed': case 'refund.pending': await syncRefund(evt.data); break;
  }
  return new Response('ok', { status: 200 });                               // always 200 fast; do slow work after
}
async function markPaidOnce(d: any) {
  // 1) verify with GET /transaction/verify/:reference and compare amount_kobo + currency + order
  // 2) UPDATE payments SET status='success' WHERE reference=$1 AND status<>'success' RETURNING order_id  -- no row = already processed, stop
  // 3) UPDATE orders SET status='paid'; decrement variant stock; insert audit_log; send order-confirmation email ONCE
}
```
**States:** `success` (paid) · `pending` (bank transfer / USSD awaiting — show “Awaiting payment”, keep order `pending`, rely on webhook) · `failed` (show reason, “Try again” creates a **new reference** on the same order) · `abandoned` (customer closed the window; a cron marks old `initialized` payments `abandoned` after e.g. 24 h and releases reserved stock) · refunds (`refund.processed`).
**Refund (admin):** `POST /api/admin/refund` → `requireAdmin()` → `POST https://api.paystack.co/refund { transaction: reference, amount }` → insert `refunds` row (`pending`) + `audit_log` → webhook `refund.processed` sets `payments.refund_status`. Refunds typically take 5–10 working days.
**Local testing:** use test keys, test cards from Paystack docs, and expose the webhook with a tunnel; set the webhook URL in the Paystack dashboard (test + live separately).

---
## 5. Mailgun
1. Add and verify the sending domain `mg.YOURDOMAIN.com`: add **SPF** (`v=spf1 include:mailgun.org ~all`), **DKIM** (two TXT records Mailgun shows), **MX** if receiving, and tracking CNAME. Wait for “Verified”. (US/EU region base URL differs: `api.mailgun.net` vs `api.eu.mailgun.net`.)
2. Upload templates from `emails/*.html` (Sending → Templates) or send HTML directly.
3. Send:
```ts
import FormData from 'form-data'; import Mailgun from 'mailgun.js';
const mg = new Mailgun(FormData).client({ username: 'api', key: process.env.MAILGUN_API_KEY! });
await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
  from: process.env.MAILGUN_FROM!, to: [order.email], subject: `Order ${order.order_number} confirmed — thank you, ${name}`,
  template: 'order-confirmation', 'h:X-Mailgun-Variables': JSON.stringify({ customer_name: name, order_number: order.order_number /* … */ }),
  'o:tag': ['order-confirmation'], 'h:Idempotency-Key': `order-confirmation-${order.id}` });
```
| Event | Template | Idempotency |
|---|---|---|
| First sign-in (profile insert) | `welcome` | `profiles.welcome_sent_at` null-check |
| Paystack `charge.success` | `order-confirmation` | `orders.confirmation_sent_at` set in same transaction |
| Quote insert | `quotation-received` | `quotes.received_email_sent_at` |
| Quote reply / booking accept or reschedule / order shipped | (next phase templates) | per-event key |
Store plain-text alternatives (see `emails/subjects-and-text.md`). Handle Mailgun webhooks (`failed`, `complained`) to suppress bad addresses.

---
## 6. Performance & security checklist (short)
Image CDN with `next/image` + WebP/AVIF, `priority` only on the hero; ISR for catalogue pages, revalidate on admin publish; strict CSP; Paystack inline script loaded only on payment step; rate-limit auth and contact endpoints; never log full webhook payloads containing card data. See `accessibility-and-performance.md`.
