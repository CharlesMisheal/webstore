# Architecture decisions

Short records of the non-obvious choices in this codebase, so the next developer knows why things are the way they are. Newest at the bottom.

## D1 — Supabase only; the JSON file store is gone

The prototype kept data in a local JSON file with a Supabase "mode" behind a flag. Two data layers meant two sets of bugs and no RLS story. `lib/db.ts` is now the single data module and talks only to Supabase. If Supabase is unreachable, read helpers return empty results and log the error (`safeRead`) so the storefront degrades rather than crashes; writes throw.

## D2 — Server code uses the service-role client; RLS protects everything else

All server-side reads/writes go through one service-role Supabase client (`createAdminSupabase()` in `lib/supabase/server.ts`; the cookie-backed `createServerSupabase()` in the same file is used only for auth). Authorization is enforced in application code (`requireAdmin()`, ownership checks on the account page) rather than by passing the user's JWT to Postgres. Reasons: the owner panel needs cross-customer queries that RLS would make awkward; the public catalogue is read via the server anyway; and the anon key never sees anything beyond the public read policies. RLS is still enabled on every table with `is_admin()` policies so a leaked anon key cannot read orders or customers.

## D3 — Integer kobo; prices rebuilt on the server at checkout

The client sends `{variant_id, qty, fit_type}` and a delivery option id only. `lib/checkout.ts` reloads variants, validates visibility/stock/fit, applies the published `delivery_rules`, and produces the order draft. Display currencies (USD/GBP) are a convenience conversion from `store_settings.fx_rates`; Paystack is always charged in NGN.

## D4 — No Paystack demo/mock mode

The prototype faked a successful payment when keys were missing. That path could never be exercised against the real API and risked shipping orders as "paid" for free. Now: missing key ⇒ `/api/pay/initialize` returns 503 and the checkout UI offers WhatsApp ordering. Testing uses Paystack test keys.

## D5 — Settlement is a pure function with injected dependencies

`settleCharge(deps, charge, source)` in `lib/payments.ts` is called by both the webhook and the verify route. It checks currency and amount against the stored order, claims the order via the Postgres function `apply_paid_order()` (atomic `update … where status = 'pending'` + stock decrement), then claims the confirmation email via `claim_order_confirmation()`. Because both claims are single-row conditional updates in Postgres, webhook and verify can race without double-marking or double-emailing. The function is unit-tested with fake deps.

## D6 — Overpayment accepted, underpayment and wrong currency rejected

A charge for more than the order total is accepted (customer may have paid a fee), logged, and the order marked paid. A charge for less, or in a non-NGN currency, leaves the order `pending` and writes a `payment.amount_mismatch` / `payment.currency_mismatch` audit row for the owner to review.

## D7 — Bespoke lines don't consume stock

Made-to-measure garments are produced per order; only `ready_to_wear` lines decrement `product_variants.stock` in `apply_paid_order()`. Stock validation at checkout follows the same rule.

## D8 — Cart cleared only after verified payment

The cart is kept until the confirmation page observes `payment.status = 'success'` (`ClearCartOnSuccess`). Previously the cart was emptied before redirecting to Paystack, so an abandoned payment lost the customer's selection.

## D9 — Google is the only sign-in; admins are allow-listed twice

Both customers and the owner use Supabase Auth with Google. An email reaches `/admin` only if it is in `ADMIN_EMAILS` *and* in `public.admins`. `ADMIN_EMAILS` has no default: an empty value locks everyone out rather than falling back to a hardcoded address. Denied attempts are audit-logged (`admin.sign_in_denied`).

## D10 — Admin idle timeout via middleware-slid cookies

Two httpOnly cookies, `aplus_admin_last_seen` and `aplus_admin_started`, implement a 30-minute sliding / 8-hour absolute window. Middleware refreshes `last_seen` on each admin request; the client shell pings `/api/admin/session` every five minutes while the owner is active and shows a countdown. `requireAdmin()` throws `HttpError(440)` on expiry, which the admin layout turns into a redirect to `/admin/login?timeout=idle`. Supabase's own session is left alone so the owner's customer-side login is unaffected.

## D11 — Route groups: `(store)` and `(admin)`

`app/(store)/layout.tsx` carries the public chrome; `app/(admin)/admin/layout.tsx` is a server component that calls `requireAdmin()` before rendering anything, so every admin page is guarded without per-page boilerplate. `app/admin/login` sits outside the group so it can render for unauthenticated users.

## D12 — Admin mutations are server actions, not fetch-to-API

Order status, quotes, bookings, reviews, content and contact handling use server actions in `app/(admin)/admin/actions.ts`, wrapped by `adminAction()` (requireAdmin → zod → work → `addAuditLog` with real actor, IP and user agent → `revalidatePath`). JSON routes remain only where a client component needs them (`/api/admin/products`, `/api/admin/categories`, `/api/admin/refund`, `/api/admin/session`), and they apply the same guard/validation/audit pattern.

## D13 — Store settings with draft/publish, cached by tag

`store_settings` holds `value` (live) and `draft_value`. Public pages read `value` through `getStoreSettings()`, cached with `unstable_cache` and tag `store-settings`; publishing revalidates the tag and the whole layout. The owner edits structured forms (banners, contact, delivery rules…) with a raw-JSON fallback; both are validated with per-key zod schemas before saving.

## D14 — Emails are inline-HTML files, rendered with a 40-line template helper

The design pack ships three HTML emails. They are copied verbatim into `emails/` and rendered by `lib/email-templates.ts` (`{{var}}`, `{{#each}}`; all values HTML-escaped). This avoids adding a templating dependency (the brief forbids unlisted libraries) and keeps the designs editable by non-engineers. `outputFileTracingIncludes` ensures the files ship in the serverless bundle. The quotation-reply email is not in the pack and is kept inline in `actions.ts` using the same chrome.

## D15 — Welcome email from `/auth/callback`, claimed in Postgres

Supabase has no reliable "first sign-in" hook we can call from the app, so the callback route calls `claim_welcome_email(user_id)` (sets `profiles.welcome_sent_at` if null, returns whether it won) and sends only when it did. Failures to send are logged and non-fatal.

## D16 — Rate limiting in Postgres, not memory

`consume_rate_limit(key, limit, window)` is a Postgres function over a `rate_limits` table, because Vercel functions are stateless and in-memory counters reset per instance. Keys are `bucket:ip`. Public forms also carry a honeypot field (`website`) that returns a fake 200 when filled.

## D17 — Text primary keys

Tables use `text primary key default uuid_generate_v4()::text` rather than `uuid`, so seed rows can have readable ids (`prod_navy_executive`) and client-side code never has to care about UUID formatting. Admin API validators accept `[A-Za-z0-9_-]{1,80}`.

## D18 — Images: keep Unsplash as a remote pattern, use the client's photos where we have them

Only two real product photos exist (`feature-suit-ivory.jpg`, `feature-suit-purple.jpg`); the rest of the demo catalogue uses Unsplash URLs until the owner uploads real photos. Brand PNGs were 2 MB each and duplicated; they are now a 97 KB logo and two ~150 KB JPEGs.

## D19 — Deliberately not done

- Cloud image upload from the admin product editor (it accepts a URL/path). Supabase Storage is the intended target; wiring the upload UI is a follow-up.
- Customer-side quote acceptance / deposit payment flow (the owner marks quotes accepted after a WhatsApp conversation).

## D20 — Cart follows the signed-in shopper across devices

Signed-in shoppers' bags are saved in `carts` / `cart_items` via `GET`/`PATCH /api/cart` (service-role, keyed by the session user; prices are re-read from the catalogue, never accepted from the client). The client sends line-level ops (`add` / `set` / `remove` / `clear`, see `lib/cart-ops.ts`) rather than the whole bag, so edits to different lines from two devices don't overwrite each other; unconfirmed ops are replayed on top of the server's reply. Pending ops are sent with `keepalive` when the page is hidden or closed, and `clear` is sent immediately. A verified payment also removes the purchased quantities from the saved bag server-side (`removePurchasedFromUserCart`), so the bag empties even if the confirmation page never loads. localStorage stays as an instant-paint cache tagged with the owning user id. On sign-in a guest bag is merged into the saved one; on sign-out the device copy is cleared. Other devices pick up changes on focus/visibility and every 30 s while visible. Guests keep a local-only bag. Display currency stays per-device on purpose.

Known limit: two devices changing the *same* line at the same instant can still race (read-then-write per line, no unique index). Duplicate rows are collapsed on read and on the next write.
