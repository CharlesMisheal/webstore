# A-Plus Fashion Home — UI/UX design pack (HNG15 Lesson 2)

Client: Henry Abraham, Ijebu-Ode · Designer: Charles Ahuose · Date: 1 Oct 2026.
All PNGs are drawn in code (Pillow) at 2× from `build/`; sample content is flagged in `assumptions-and-questions.md`.

## Index
| # | File | What it is |
|---|---|---|
| 01 | `01-sitemap-and-flows.png`, `.md` | Sitemap + 7 flows (browse/buy/pay, Google sign-in, payment states, quote, booking, tracking, admin order handling); Mermaid source in `.md` |
| 02 | `02-wireframes-1-storefront.png` … `-4-admin.png` | Greyscale low-fi wireframes: storefront, checkout/account, services/info, owner admin (mobile) |
| 03 | `03-hifi-mobile-1…9-*.png` | Hi-fi mobile (390×844): home, shop, cart/checkout, payment, payment states, login, account/tracking, booking/reviews/contact, about |
| 04 | `04-hifi-desktop-1…16-*.png` | Hi-fi desktop (1440): home, category, product, cart, checkout ×3, payment states, confirmation, login, account, tracking, quote, booking, about/contact, reviews |
| 05–07 | `05-email-order-confirmation.png`, `06-email-welcome.png`, `07-email-quotation-received.png` | Email designs (600 px) |
| 08 | `08-style-guide.png`, `style-guide.md` | Colours + contrast, type, spacing, components, icons, imagery |
| 09 | `09-trust-elements.png` | Reviews, sample return policy, payment badges, size guide, measuring tips |
| 10 | `10-admin-desktop-*.png` (26 files) | **Owner admin, desktop 1440**: 01 login (+ access denied), 02 dashboard, 03 products (list/bulk/delete/empty), 04 product form (multi-image + reorder), 05 categories (inline rename, drag-reorder, delete confirm, toast), 06 orders (list/bulk), 07 order detail (status update, toast), cancel/refund dialog, print invoice, 08 payments (+ refund dialog, empty), 09 customers (+ order history), 10 quotes & bookings (reply/reschedule/reject dialogs), 11 reviews (toast, delete dialog, empty), 12 store content |
| 10 | `10-admin-mobile-1…4-*.png` | **Owner admin, mobile 390×844** contact sheets (bottom tab bar + More sheet, tables → stacked cards). Individual screens: `admin-mobile-screens/10-admin-mobile-01…25-*.png` |
| — | `emails/*.html`, `emails/subjects-and-text.md` | Production-ready table-based inline-CSS emails with Mailgun variables; subjects, pre-headers, plain-text versions |
| — | `developer-note.md` | Data model, **admin data model & permissions** (role check, RLS, server-side guard, audit log, soft delete, image bucket, store_settings), Supabase Google auth, Paystack (initialize/verify/webhook/refunds), Mailgun |
| — | `homepage-copy.md`, `accessibility-and-performance.md`, `assumptions-and-questions.md` | Copy, a11y/perf targets, assumptions and questions for the client |
| — | `assets/` | Logo crop, photo crops, source copies; `build/` = generator scripts (`/tmp/imgvenv/bin/python run*.py`) |

## Admin coverage checklist
Secure Google login + owner allow-list + session timer ✔ · Dashboard (NGN sales, recent orders, low stock, top sellers, pending quotes/bookings) ✔ · Products CRUD ✔ · Categories ✔ · Orders + invoice + cancel/refund ✔ · Payments + refund ✔ · Customers ✔ · Quotes/bookings dialogs ✔ · Reviews ✔ · Store content ✔ · search + filters on every list ✔ · confirmation dialogs ✔ · empty states ✔ · success toasts ✔.
