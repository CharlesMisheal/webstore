# A-Plus Fashion Home — web store

Bespoke and ready-to-wear formal menswear from Ijebu-Ode, Nigeria. Customers browse the catalogue, pay in Naira via Paystack, request bespoke quotations, and book fittings; the owner runs everything from a Google-protected admin panel.

**Stack:** Next.js 14 (App Router, TypeScript strict) · Tailwind · Supabase (Postgres, Auth, RLS) · Paystack · Mailgun · Vitest.

Design brief, wireframes and email designs live in `aplus-1-docs-emails-wireframes/`; engineering rules in `aplus-agent.md`; architecture decisions in `DECISIONS.md`.

---

## 1. Local setup

Requirements: Node 18.17+ (20 LTS recommended), npm, a Supabase project, a Google Cloud project, a Paystack test account.

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                    # http://localhost:3000
```

Checks before pushing:

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

## 2. Environment variables

See `.env.example` for the annotated list. Summary:

| Variable | Where | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | client+server | yes | Public origin without trailing slash. Drives OAuth redirects, Paystack callback and email links. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | yes | Supabase → Project Settings → API. |
| `SUPABASE_SERVICE_ROLE_KEY` | server | yes | Bypasses RLS for all server-side data access. **Rotate immediately if it ever leaks.** |
| `ADMIN_EMAILS` | server | yes | Comma-separated Google emails allowed into `/admin`. No default — empty means nobody can sign in. The same email must also be in the `public.admins` table. |
| `PAYSTACK_SECRET_KEY` | server | prod | `sk_test_…` locally, `sk_live_…` in production. Unset ⇒ checkout returns 503 and the UI offers WhatsApp ordering instead. |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` / `MAILGUN_FROM` | server | prod | Unset ⇒ emails are skipped with a console warning. |
| `MAILGUN_API_BASE` | server | no | Only for EU Mailgun domains (`https://api.eu.mailgun.net`). |

Never commit `.env.local`. `.gitignore` already excludes it.

## 3. Supabase

### 3.1 Apply the migrations (required — nothing works until this is done)

Run both files **in order** in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run), or with the CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*.sql
```

1. `supabase/migrations/20261001_initial_schema.sql` — all tables, enums, `is_admin()`, `handle_new_user()` trigger (creates a `profiles` row on sign-up), RLS on every table, public read policies for the catalogue.
2. `supabase/migrations/20261002_payments_rate_limits_and_helpers.sql` — `rate_limits` table, `consume_rate_limit()`, and the atomic payment helpers `apply_paid_order()`, `claim_order_confirmation()`, `claim_welcome_email()`.

Then seed demo content (idempotent; safe to re-run):

3. `supabase/seed.sql` — the owner's admin row, 5 categories, 8 products with variants, 4 approved reviews, and default `store_settings`. Re-running refreshes catalogue copy but never overwrites settings the owner has already published, nor any stock, orders or customer data.

If the store shows an empty catalogue and the server logs contain `PGRST205` ("table not found in schema cache"), the migrations have not been applied to the project in `NEXT_PUBLIC_SUPABASE_URL`.

### 3.2 Google sign-in

**Google Cloud Console** (console.cloud.google.com → APIs & Services → Credentials):

1. Configure the OAuth consent screen (External; add the owner email as a test user while in Testing).
2. Create an **OAuth client ID** → Web application.
3. Authorised JavaScript origins: `http://localhost:3000` and your production origin.
4. Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (copy the exact value from Supabase → Authentication → Providers → Google).
5. Copy the Client ID and Client Secret.

**Supabase** (Authentication → Providers → Google): enable, paste Client ID/Secret, save.

**Supabase** (Authentication → URL Configuration):

- Site URL: your production origin (e.g. `https://aplusfashion.ng`).
- Redirect URLs: add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.

Customers sign in at `/auth/login`; the owner at `/admin/login`. Both go through `/auth/callback`. An email is admitted to `/admin` only if it is **both** in `ADMIN_EMAILS` **and** in the `public.admins` table (defence in depth — `is_admin()` in SQL, `requireAdmin()` on every admin route and server action). Admin sessions expire after 30 minutes idle (8 hours absolute); the admin shell shows a countdown and keeps the session alive while the owner is active.

To add another admin: insert their email into `public.admins` and append it to `ADMIN_EMAILS`, then redeploy.

## 4. Paystack

1. Dashboard → Settings → API Keys & Webhooks. Put the **secret** key in `PAYSTACK_SECRET_KEY`. The public key is not needed (we use the server-side redirect flow).
2. Webhook URL: `https://<your-domain>/api/paystack/webhook`. Paystack signs each call with HMAC-SHA512 of the raw body using your secret key; the route rejects anything that fails `timingSafeEqual`.
3. Events handled: `charge.success` (marks the order paid exactly once, decrements ready-to-wear stock, sends the confirmation email once), `charge.failed` / `charge.abandoned`, `refund.processed|pending|failed`.
4. The customer is also redirected to `/order/<number>/confirmation?reference=…`, where the server calls Paystack **verify** — so an order is marked paid by whichever of webhook or verify arrives first, never twice.

Amounts are always integer kobo and are recomputed server-side from the database at checkout; the client only sends variant ids and quantities. A charge whose amount or currency doesn't match the order is recorded in the audit log and the order stays `pending` for manual review.

Local testing: use test cards from Paystack docs; for webhooks, expose `npm run dev` with a tunnel (e.g. `ngrok http 3000`) and set the tunnel URL as the test webhook.

## 5. Mailgun

1. Add a sending domain (`mg.yourdomain.com`), and create the DNS records Mailgun shows you: two TXT (SPF + DKIM), MX pair, and CNAME for tracking. Wait for "Verified".
2. Add a DMARC record on the root domain: `_dmarc TXT "v=DMARC1; p=quarantine; rua=mailto:postmaster@yourdomain.com"`.
3. Create a **Sending API key** (Settings → API Security) and set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`.

Emails sent (inline-HTML templates in `emails/`, from the design pack):

- Order confirmation — exactly once per paid order (guarded by `claim_order_confirmation()`).
- Welcome — on a customer's first Google sign-in (guarded by `claim_welcome_email()`).
- Quotation received — when a bespoke request is submitted.
- Quotation reply — when the owner sends a price from Admin → Requests.

Each send carries a Mailgun idempotency key, so retries don't duplicate.

## 6. Deploy to Vercel

1. Import the repository; framework preset Next.js; leave build command `next build`.
2. Add every variable from section 2 (Production and Preview). Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. After the first deploy, add the production origin to Google (JavaScript origins) and Supabase (Redirect URLs), and set the Paystack webhook URL.
4. Point your domain at Vercel; Vercel issues TLS automatically.

The `emails/` directory is included in the serverless bundle via `outputFileTracingIncludes` in `next.config.mjs`.

## 7. Project map

```
app/
  (store)/            customer-facing pages (shared Navbar/Footer/Cart chrome)
  (admin)/admin/      owner panel — server-guarded by requireAdmin() in layout.tsx
    actions.ts        all admin mutations: requireAdmin + zod + audit_log + revalidate
  admin/login/        owner sign-in (outside the guarded group)
  auth/callback/      Google OAuth code exchange; admin cookies; welcome email
  api/
    pay/initialize    builds the order server-side, creates a Paystack transaction
    pay/verify        server-side Paystack verify for the confirmation page
    paystack/webhook  HMAC-verified webhook
    admin/*           owner-only JSON endpoints (products, categories, refund, session)
    quotes|bookings|contact|reviews   public forms: zod + honeypot + rate limit
lib/
  db.ts               the only module that talks to Supabase (service role)
  checkout.ts         pure order-draft builder (prices, stock, delivery fee)
  payments.ts         settleCharge(): idempotent paid-order settlement (DI, unit-tested)
  paystack.ts         Paystack REST + signature verification
  email.ts / email-templates.ts   Mailgun + lite template renderer
  admin-guard.ts      requireAdmin(), allow-list, idle/absolute expiry
supabase/
  migrations/         schema + helpers (apply in order)
  seed.sql            demo content
tests/                vitest (money, checkout, payments, templates, admin guard, paystack)
```

## 8. Owner's day-to-day

- `/admin` — dashboard. Orders → change status (paid → processing → shipped → delivered), add tracking link, cancel with reason, print invoice.
- Payments → see every Paystack attempt; issue full or partial refunds (goes to Paystack, mirrored locally, audit-logged).
- Requests → reply to bespoke quotes with price + ready-by date (emails the customer), confirm/reschedule fittings, mark contact messages handled.
- Reviews → publish, hide or delete customer reviews.
- Content → edit homepage banners, about text, contact details, social links, FX display rates and delivery fees. **Save draft** to stage, **Publish** to go live.
- Audit log → every admin action with before/after values, IP and user agent.

## 9. Security checklist (what's enforced in code)

- Money is integer kobo everywhere; totals recomputed server-side; client never sets price, total or payment status.
- Paystack webhook signature verified; settlement idempotent (`apply_paid_order` claims the order atomically).
- Service-role key and Paystack/Mailgun secrets are server-only; `.env.local` is git-ignored.
- RLS enabled on every table; `is_admin()` in SQL; `requireAdmin()` on every admin page, route and server action.
- Admin idle timeout 30 min; audit row for every admin change; soft-delete for products with order history.
- zod on all input; rate limits on checkout, quotes, bookings, contact, reviews; honeypot field on public forms.
- Security headers (nosniff, SAMEORIGIN, referrer-policy, permissions-policy) in `next.config.mjs`.
