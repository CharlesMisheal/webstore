# Assumptions & open questions

**Assumptions I made (please confirm with Henry)**
1. **Logo** = the circular emblem from the third uploaded PNG (white marble background, transparent corners masked). It is a raster crop; ask for a vector/SVG or a high-res original before launch.
2. **Palette** is derived from the logo and flyer: deep navy, antique gold, ivory, with beige/brown from the lookbook. Gold on ivory is used for decoration only (2.7:1); gold text uses the darker `#8A6A1F` (4.7:1).
3. **Currency:** NGN is primary. USD and GBP are *indicative* estimates (display only, rate set in `store_settings`) — Paystack charges in NGN unless USD is enabled on the account.
4. **Prices, product names, stock and sizes** in mock-ups are samples. **Size chart, measuring tips and return/alteration policy** are sample text to be replaced by Henry’s real terms.
5. **Shipping rules unknown.** Delivery options and fees (Lagos & Ogun courier ₦4,500, nationwide, international DHL, shop pick-up) are samples. Need: zones, prices, timelines, whether international orders are accepted.
6. **Contact numbers:** the brief gives WhatsApp **+234 707 137 4515**; the flyer prints **09055080524** and **08063124000**. I used the brief’s number everywhere. Which numbers should be shown for calls and which for WhatsApp?
7. **Domain** is TBD (shown as `YOURDOMAIN.com`); Mailgun sending subdomain `mg.` assumed. **Shop email** `henryaplus82@gmail.com` is used as shown in the brief; a domain email is recommended for deliverability.
8. **Opening hours** (Mon–Sat 9:00–18:00), **social handles** (Instagram/Facebook/TikTok) and **shop address** line are placeholders to confirm.
9. **Reviews** (names, ratings, text), “128 reviews”, “5+ years”, “100+ products”, customer names in the admin mock-ups are sample data. Replace with real testimonials only with permission.
10. **Payment badges** are generic labels, not official brand logos (use Paystack’s official assets when licensed). The **Google “G”** is a simplified generic mark — use Google’s official sign-in button asset in production.
11. **Photography** is taken from the client’s lookbook/flyer/portraits; some crops are low-resolution. A fresh product shoot (front/back/detail, on plain background) is recommended.
12. **Admin owner email allow-list** is TBD (`ADMIN_EMAILS`). The design assumes a single owner; a second staff account would need the `admins` table.
13. **Admin session**: 30-minute idle timeout and 8-hour absolute limit are recommendations.
14. **Language** is English (Nigeria spelling); no multi-language requirement assumed.

**Questions for Henry**
- Which Google account (email) should be the owner/admin login?
- Do you ship outside Nigeria? Which couriers, prices, timelines?
- Are products ready-to-wear only, or also made-to-measure with online price? (Design supports both: “Add to cart” and “Request a quote”.)
- Return/alteration policy and free-alteration period (sample says 14 days)?
- Which payment channels do you want enabled on Paystack (card, bank transfer, USSD, international cards)?
- Real opening hours, social links, and the About Us story/years in business?
- Who replies to quotes — only you, or staff too?
