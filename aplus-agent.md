# agent.md — A-Plus Fashion Home online store

You are the coding agent building the A-Plus Fashion Home website (HNG15 Lesson 2 individual task). Follow this file and the design pack in `design/` (the folder containing the README, PNGs, emails and docs). If something here conflicts with a design PNG, the PNG wins for visuals and `developer-note.md` wins for data and API behaviour. If something is missing, make the simplest sensible choice, note it in `DECISIONS.md`, and keep going. Do not invent features outside this file.

## 1. Product in one paragraph
A premium, mobile-first online shop for A-Plus Fashion Home (Ijebu-Ode, Nigeria): bespoke and ready-to-wear unisex formal wear (suits, jackets, blazers, tuxedos, shirts, pants). Owner: Henry Abraham, WhatsApp +2347071374515, henryaplus82@gmail.com. Slogan: "Wear Class, Live Bold". Customers are professionals, grooms and wedding parties, event guests and buyers abroad, mostly on slow mobile connections. Primary currency is NGN; USD/GBP are display-only estimates.

## 2. Stack (fixed unless told otherwise)
- Next.js (App Router) + TypeScript, Tailwind CSS.
- Supabase: Postgres, Auth (Google), Storage, Row Level Security. (Neon is allowed only if the owner asks.)
- Paystack for payments; Mailgun for email; deployment on Vercel.
- No heavy UI kits. Small, self-written components. Icons: Lucide (thin 1.5px).

## 3. Read these first, in order
1. `README.md` (index of the pack)
2. `style-guide.md` and `08-style-guide.png`
3. `developer-note.md` (data model, RLS, admin guard, Google auth, Paystack, Mailgun)
4. `01-sitemap-and-flows.md`, `homepage-copy.md`, `accessibility-and-performance.md`, `assumptions-and-questions.md`
5. The screens you are building: `03-hifi-mobile-*`, `04-hifi-desktop-*`, `10-admin-*`, emails in `emails/*.html`.

## 4. Design tokens (use as CSS variables / Tailwind theme)
- Navy `#0E1B33` · Navy 2 `#14254A` · Ink `#0A0F1A`
- Gold `#B8923A` (fills, icons and borders only) · Gold light `#D4AF5A` (text on navy) · Gold dark `#8A6A1F` (gold text on ivory)
- Ivory `#FAF7F0` · Ivory 2 `#F2EDE2` · Stone `#E9E7E3` · Beige `#C9B79C` · Brown `#4A3426`
- Success `#2F7D5B` · Error `#B3402F` · Warning `#9A6A12` · Info `#243E75`
- Text `#1B2230` · Text 2 `#4B5565` · Text 3 `#6B7280`
- Fonts: Playfair Display (headings) and Inter (UI and body), loaded with `next/font`, subset to Latin, `display: swap`. Fallbacks: Georgia / system-ui.
- Spacing: 4/8px grid. Radius: 2–4px (tailored look). No heavy gradients or heavy shadows.
- Never put `#B8923A` text on ivory (fails contrast); use `#8A6A1F`.
- Buttons: primary navy with ivory text; secondary gold outline; WhatsApp/quote accents per style guide. Minimum touch target 48px.

## 5. Features to build (all required)
Storefront: home, categories, search, product page (size selector, size guide, reviews, add to cart, WhatsApp order, request bespoke quote), cart, checkout, Paystack payment, payment result pages, order confirmation, order tracking, quote request, fitting/measurement booking, reviews, contact form, About Us, social links, floating WhatsApp button, return policy and size guide pages.
Accounts: Google sign-in (login and sign-up screens, button states: default, hover, focus, pressed, loading, disabled, error), account page with saved details, order history.
Admin (owner only, full CRUD, mobile-friendly): dashboard home; products (multiple images, price, description, category, sizes, stock, show/hide); categories (add, rename, reorder, delete); orders (list, detail, status update, invoice print, cancel/refund); payments (Paystack transactions and refund status); customers (list and history); quotes and bookings (view, reply, accept, reject, reschedule); reviews (approve, hide, delete); store content (banners, About text, contact details, WhatsApp number, social links). Search and filters on every list; confirmation dialogs for deletes, bulk actions and refunds.
Emails (Mailgun, from `emails/*.html`): order confirmation, welcome, quotation received.

## 6. Hard rules (security and money)
- Money is integer kobo. Never use floats for money.
- Never trust the client for price, total or payment status. The server recalculates totals from the database.
- Paystack flow: server creates the order as `pending` and a unique `reference`, calls `/transaction/initialize`; the callback page calls the server, which calls `/transaction/verify/:reference` and checks status, amount and currency; the webhook verifies the `x-paystack-signature` (HMAC SHA512 of the raw body with the secret key) and handles `charge.success` and `refund.processed` idempotently. Only the verified server path may mark an order `paid`, reduce stock and send the confirmation email once. Handle pending (bank transfer, USSD), failed, abandoned and retry states.
- Secrets (`PAYSTACK_SECRET_KEY`, `MAILGUN_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live only in server env vars. Never expose them to the browser or commit them. Provide `.env.example` with names only.
- Enable RLS on every table. Admin access: `is_admin()` check in the database AND a server-side `requireAdmin()` guard on every admin route and server action. Require a verified Google email in the owner allow-list (`ADMIN_EMAILS`). Admin session idle timeout 30 minutes. Write an `audit_log` row for every admin change.
- Products with order history are archived (soft delete), never hard-deleted. Order items store snapshots (name, size, price).
- Validate all input on the server (zod). Rate-limit the contact, quote and booking forms. Sanitize rich text from store content.
- Emails must not contain secrets. Send order confirmation exactly once per paid order.

## 7. Performance and accessibility (slow phones first)
- Budgets: under 150 KB critical JS/CSS on first load, LCP under 2.5 s on slow 4G, no layout shift.
- Use `next/image` with WebP/AVIF at 480/800/1200 widths, lazy loading, blur placeholders, correct `sizes`. Product cards 4:5 portrait; hero 4:5 on mobile and wide on desktop; keep the subject head-to-shoe with margin.
- Server-render or statically cache catalogue pages; keep the cart in localStorage, merged to the database after login. Show skeletons, not spinners. WhatsApp is the fallback checkout when anything fails.
- WCAG AA: contrast, visible focus rings, labelled form fields with inline error text, keyboard-operable menus and dialogs (focus trap, Escape closes), `aria-live` for payment status, descriptive alt text, `prefers-reduced-motion` respected.

## 8. Content rules
- Use the copy in `homepage-copy.md`. Prices, reviews, return policy, delivery fees, size values and social handles in the design are SAMPLE: load them from the database/`store_settings`, and keep them easy to edit in admin. Do not hard-code them.
- The logo is `assets/logo.png` (raster). Use as-is, do not redraw or recolour it. Product photos in `assets/photos` are samples from the client; the real catalogue is uploaded through admin.
- WhatsApp number comes from `store_settings.contact.whatsapp`; default +2347071374515. Order links use `https://wa.me/2347071374515?text=...` with the product name, size and link prefilled.
- Payment badges and the Google "G" in the design are generic. Use the official Google sign-in button guidelines and official Paystack assets when building.

## 9. How to work
1. Plan first: write `PLAN.md` with the file structure, routes, and migration list. Then build in this order: design tokens and layout; database migrations and RLS; Google auth and profiles; catalogue pages; cart; checkout and Paystack; emails; order history and tracking; quotes, bookings, reviews, contact; admin; polish.
2. Commit small, in working steps. Each step must build and run (`npm run build`, lint and type-check pass).
3. Add tests for money maths, the Paystack verify/webhook handlers (signature, idempotency, amount mismatch) and the admin guard.
4. Seed script with sample categories and products so every screen renders. Use Paystack test keys and Mailgun sandbox in development.
5. Match the PNGs closely on mobile first, then tablet and desktop. When unsure, choose the calmer, simpler option. Do not add libraries or features that are not listed.
6. Finish with a `README.md` covering setup, env vars, Google Cloud Console and Supabase steps, Paystack webhook URL setup, Mailgun domain setup, and deployment.

## 10. Definition of done
Every screen in the design pack works end to end on mobile and desktop; a test Paystack payment marks the order paid, saves the payment, reduces stock and sends the confirmation email once; Google sign-in works; the owner can run the whole shop from `/admin` on a phone; no secret is exposed; build, lint and tests pass.
