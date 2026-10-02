# PLAN.md — A-Plus Fashion Home Webstore Architecture

## 1. File Structure
```
webstore/
├── aplus-1-docs-emails-wireframes/   # Existing specs, wireframes, style guide & emails
├── aplus-2-mobile-screens/           # Existing mobile PNG designs
├── aplus-3-desktop-screens/          # Existing desktop PNG designs
├── aplus-4-admin-desktop/            # Existing admin desktop PNG designs
├── aplus-5-admin-mobile/             # Existing admin mobile PNG designs
├── admin-mobile-screens/             # Existing admin mobile individual screens
├── app/
│   ├── layout.tsx                    # Root layout with Playfair + Inter fonts & CartProvider
│   ├── page.tsx                      # Homepage with Hero, Trust Strip, Categories, Bespoke, Reviews
│   ├── shop/
│   │   └── page.tsx                  # Product catalogue with filtering, sorting, search
│   ├── category/
│   │   └── [slug]/page.tsx           # Category filtered view
│   ├── product/
│   │   └── [slug]/page.tsx           # Product detail with gallery, size guide modal, WhatsApp order
│   ├── cart/
│   │   └── page.tsx                  # Shopping cart with kobo math & delivery selector
│   ├── checkout/
│   │   └── page.tsx                  # Checkout with address details, courier selection & Paystack
│   ├── order/
│   │   ├── [orderNumber]/
│   │   │   └── confirmation/page.tsx # Order confirmation with payment status (success/pending/failed)
│   │   └── track/page.tsx            # Order tracking by APF reference
│   ├── quote/
│   │   └── page.tsx                  # Bespoke quote request form (QT-...)
│   ├── booking/
│   │   └── page.tsx                  # Fitting consultation booking (BK-...)
│   ├── reviews/
│   │   └── page.tsx                  # Customer reviews directory & submission form
│   ├── about/
│   │   └── page.tsx                  # Brand story & Ijebu-Ode workshop
│   ├── contact/
│   │   └── page.tsx                  # Contact form & location information
│   ├── size-guide/
│   │   └── page.tsx                  # Tailoring size charts & measurement instructions
│   ├── return-policy/
│   │   └── page.tsx                  # Alteration & return policy
│   ├── auth/
│   │   ├── login/page.tsx            # Google sign-in with full button interaction states
│   │   └── signup/page.tsx           # Google sign-up
│   ├── account/
│   │   └── page.tsx                  # Customer dashboard, orders, measurements, bookings
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout (desktop sidebar + mobile bottom nav + session timer)
│   │   ├── login/page.tsx            # Admin login & access denied handling
│   │   ├── page.tsx                  # Admin dashboard metrics (revenue, orders, low stock, quotes)
│   │   ├── products/
│   │   │   ├── page.tsx              # Products CRUD table, search/filter, bulk actions, soft delete
│   │   │   ├── new/page.tsx          # Create product form with multi-image & variants
│   │   │   └── [id]/page.tsx         # Edit product form
│   │   ├── categories/
│   │   │   └── page.tsx              # Category manager, drag/keyboard reordering
│   │   ├── orders/
│   │   │   ├── page.tsx              # Orders table with status filters & search
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Order detail, status updater, cancel/refund dialog
│   │   │       └── invoice/page.tsx  # Printable invoice
│   │   ├── payments/
│   │   │   └── page.tsx              # Paystack transactions & refund modal
│   │   ├── customers/
│   │   │   ├── page.tsx              # Customer list & CSV export
│   │   │   └── [id]/page.tsx         # Customer purchase history
│   │   ├── requests/
│   │   │   └── page.tsx              # Quotes (reply dialog) & Fitting bookings (accept/reschedule)
│   │   ├── reviews/
│   │   │   └── page.tsx              # Review moderation (approve, hide, delete)
│   │   ├── content/
│   │   │   └── page.tsx              # Store settings CMS (banners, about, contact, FX rates)
│   │   └── audit-log/
│   │       └── page.tsx              # Audit trail of admin actions
│   └── api/
│       ├── pay/
│       │   ├── initialize/route.ts   # Paystack transaction initialization
│       │   └── verify/route.ts       # Paystack transaction verification
│       ├── paystack/
│       │   └── webhook/route.ts      # Paystack HMAC SHA512 webhook handler
│       ├── admin/
│       │   ├── [action]/route.ts     # Protected admin endpoints
│       │   └── refund/route.ts       # Paystack refund handler
│       ├── quotes/route.ts           # Quote submission handler
│       ├── bookings/route.ts         # Fitting booking handler
│       └── contact/route.ts          # Contact form handler
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Store navigation, search bar, currency selector, cart button
│   │   ├── Footer.tsx                # Store footer, links, payment security badges
│   │   └── AdminNav.tsx              # Desktop sidebar & mobile bottom navigation
│   ├── ui/
│   │   ├── WhatsAppButton.tsx        # Floating WhatsApp action button
│   │   ├── SizeGuideModal.tsx        # Interactive size guide & measuring tips modal
│   │   ├── CurrencySelector.tsx      # NGN / USD / GBP currency switcher
│   │   ├── Toast.tsx                 # Accessible live region notifications
│   │   └── ConfirmDialog.tsx         # Accessible confirmation modal for destructive actions
│   ├── cart/
│   │   ├── CartDrawer.tsx            # Slide-over cart drawer
│   │   └── CartItemRow.tsx           # Cart item modifier
│   └── product/
│       ├── ProductCard.tsx           # 4:5 product card with quick-actions & stock status
│       └── ImageGallery.tsx          # Multi-image viewer with thumbnail selection
├── lib/
│   ├── money.ts                      # Integer kobo math, formatting, currency conversion
│   ├── admin-guard.ts                # Server-side requireAdmin guard with allow-list
│   ├── paystack.ts                   # Paystack API client & HMAC SHA512 signature checker
│   ├── email.ts                      # Mailgun email sender & HTML template renderer
│   ├── audit.ts                      # Audit logging service
│   ├── db.ts                         # Resilient data layer (Supabase client + out-of-the-box fallback)
│   └── mock-data.ts                  # High-fidelity Nigerian formal wear seed data
├── supabase/
│   ├── migrations/
│   │   └── 20261001_initial_schema.sql # Complete SQL schema with RLS and triggers
│   └── seed.sql                      # Production-ready seed data
├── tests/
│   ├── money.test.ts                 # Unit tests for integer kobo math & currency conversions
│   ├── paystack.test.ts              # Unit tests for HMAC SHA512 verification & idempotency
│   └── admin-guard.test.ts           # Unit tests for admin authorization logic
├── tailwind.config.ts                # Tailwind config with exact A-Plus design tokens
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── .env.example                      # Documented environment variables template
└── README.md                         # Setup guide & operational instructions
```

## 2. Routes Checklist
- **Storefront**:
  - `/` (Home)
  - `/shop` (All products & search)
  - `/category/[slug]` (Category collection)
  - `/product/[slug]` (Product detail with size selector & guide)
  - `/cart` (Cart summary & checkout trigger)
  - `/checkout` (Delivery info, courier selection, Paystack payment)
  - `/order/[orderNumber]/confirmation` (Payment states: success, pending, failed)
  - `/order/track` (Order status timeline)
  - `/quote` (Bespoke quotation request)
  - `/booking` (In-person & video fitting bookings)
  - `/reviews` (Customer reviews directory & submission)
  - `/about` (Brand story)
  - `/contact` (Contact form & workshop address)
  - `/size-guide` (Sizing charts & measuring tips)
  - `/return-policy` (Alteration & return terms)
- **Account**:
  - `/auth/login` (Google sign-in)
  - `/auth/signup` (Google sign-up)
  - `/account` (User profile, past orders, bookings, measurements)
- **Admin**:
  - `/admin/login` (Owner login & access denied state)
  - `/admin` (Metrics dashboard)
  - `/admin/products` (Product list, bulk actions, soft delete)
  - `/admin/products/new` (Create product)
  - `/admin/products/[id]` (Edit product & manage variants)
  - `/admin/categories` (Category manager & reordering)
  - `/admin/orders` (Orders list & status filters)
  - `/admin/orders/[id]` (Order details & tracking updater)
  - `/admin/orders/[id]/invoice` (Print invoice)
  - `/admin/payments` (Paystack transactions & refund trigger)
  - `/admin/customers` (Customer directory & order history)
  - `/admin/requests` (Quote reply dialog & fitting bookings)
  - `/admin/reviews` (Review moderation)
  - `/admin/content` (Store content CMS)
  - `/admin/audit-log` (Audit trail)

## 3. Database Schema & Migration List
- `20261001_initial_schema.sql`:
  - `profiles`: id (uuid), email, full_name, phone, country, role ('customer' | 'owner')
  - `admins`: email (pk), user_id, added_by, created_at
  - `categories`: id, name, slug, image_path, sort_order, is_visible, deleted_at
  - `products`: id, category_id, name, slug, description, price_kobo, is_visible, archived_at, created_at, updated_at
  - `product_images`: id, product_id, storage_path, alt, sort_order, is_cover
  - `product_variants`: id, product_id, size_label, sku, stock
  - `carts` & `cart_items`: cart persistence and guest merge
  - `orders`: id, order_number (APF-YYMMDD-####), user_id, status, subtotal_kobo, delivery_fee_kobo, total_kobo, currency, shipping_address, tracking_url, internal_note, placed_at
  - `order_items`: snapshot of name, size, unit_price_kobo, qty, image_snapshot
  - `payments`: reference (pk), order_id, provider, channel, amount_kobo, status, refund_status, raw, paid_at
  - `refunds`: id, payment_id, amount_kobo, reason, paystack_refund_id, status, created_by, created_at
  - `quotes`: id, reference (QT-...), user_id, garment, occasion, event_date, budget_min_kobo, budget_max_kobo, notes, photo_paths, status, quoted_price_kobo, ready_by, owner_message
  - `bookings`: id, reference (BK-...), user_id, type ('shop' | 'video'), starts_at, status, notes
  - `reviews`: id, product_id, user_id, rating (1-5), body, status ('under_review' | 'approved' | 'hidden'), created_at
  - `contact_messages`: id, name, email, message, handled
  - `store_settings`: key (pk), value (jsonb), draft_value (jsonb), updated_by, updated_at
  - `audit_log`: id, actor_id, actor_email, action, entity, entity_id, before, after, ip, user_agent, created_at
  - RLS enabled on all tables, `is_admin()` security definer function, and user creation trigger.
