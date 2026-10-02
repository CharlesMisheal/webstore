# Email subjects, pre-headers and plain-text versions

Sender: `A-Plus Fashion Home <orders@mg.YOURDOMAIN.com>` (domain TBD — see `../assumptions-and-questions.md`).
Templates use Mailgun/Handlebars variables: `{{customer_name}}`, `{{order_number}}` etc. Upload each `.html` as a Mailgun template and paste the matching text into the template's text part (or send as `text` when calling the API).
Common variables on all templates: `logo_url`, `site_url`, `shop_address`, `whatsapp_number`, `whatsapp_url`, `shop_email`, `instagram_url`. Replace `%unsubscribe_url%` only for marketing mail; for transactional mail (order, quote) keep the link to preferences or remove it.

## 1. order-confirmation.html
- **Subject:** `Order {{order_number}} confirmed — thank you, {{customer_name}}`
- **Pre-header:** Your A-Plus order {{order_number}} is confirmed.
- **Extra variables:** `order_date`, `items[]` (`name`, `size`, `fit_type`, `qty`, `line_total`, `image_url`), `subtotal`, `delivery_method`, `delivery_fee`, `total`, `payment_channel`, `payment_reference`, `delivery_address`, `estimated_delivery`, `tracking_url`, `booking_url`.
- **Trigger:** Paystack webhook `charge.success` after the order is marked `paid` (idempotent — send once, store `email_sent_at`).

```
Thank you, {{customer_name}}.
Your order is confirmed and our tailors are on it.

Order number: {{order_number}}
Date: {{order_date}}

{{#each items}}- {{this.name}} | Size {{this.size}} | Qty {{this.qty}} | {{this.line_total}}
{{/each}}
Subtotal: {{subtotal}}
Delivery ({{delivery_method}}): {{delivery_fee}}
TOTAL PAID: {{total}}
Paid via Paystack ({{payment_channel}}) - Ref. {{payment_reference}}

Deliver to: {{customer_name}}, {{delivery_address}}
Estimated delivery: {{estimated_delivery}}

Track your order: {{tracking_url}}
Questions? WhatsApp us: {{whatsapp_url}}
Made-to-measure? Book a free fitting: {{booking_url}}

A-Plus Fashion Home - Wear Class, Live Bold
{{shop_address}} | WhatsApp {{whatsapp_number}} | {{shop_email}}
```

## 2. welcome.html
- **Subject:** `Welcome to A-Plus Fashion Home, {{customer_name}}`
- **Pre-header:** Wear Class, Live Bold.
- **Extra variables:** `shop_url`, `quote_url`, `booking_url`.
- **Trigger:** first Google sign-in (profile row created) — Supabase DB trigger → Edge Function / route handler → Mailgun.

```
Hello, {{customer_name}}.
Dress the Best Version of You.

Thank you for creating your A-Plus account. Track orders, save your measurements and check out faster - all signed in with your Google account.

- Shop the collection: {{shop_url}}
- Go bespoke (request a quote, reply within 24 hours): {{quote_url}}
- Book a fitting (shop in Ijebu-Ode or by video): {{booking_url}}

Prefer to chat? WhatsApp {{whatsapp_number}}: {{whatsapp_url}}

A-Plus Fashion Home - {{shop_address}}
```

## 3. quotation-received.html
- **Subject:** `We've received your quote request {{quote_reference}}`
- **Pre-header:** We reply within 24 hours.
- **Extra variables:** `quote_reference`, `garment`, `occasion`, `event_date`, `budget`, `measurements_status`, `photo_count`, `contact_preference`, `booking_url`.
- **Trigger:** insert into `quotes` (status `requested`).

```
Quote request received
Thank you, {{customer_name}}. Henry or a member of our tailoring team will reply with your quotation within 24 hours.

Reference: {{quote_reference}}  (status: under review)
Garment: {{garment}}
Occasion: {{occasion}}
Event date: {{event_date}}
Budget: {{budget}}
Measurements: {{measurements_status}}
Reference photos: {{photo_count}} attached
Contact preference: {{contact_preference}}

What happens next
1. We review your request and photos
2. You receive a quotation by email / WhatsApp
3. Book a fitting, approve and pay securely via Paystack

Book a fitting: {{booking_url}}
Chat on WhatsApp: {{whatsapp_url}}
```

## Notes
- Table layout, inline CSS, 600px, single column under 620px; no web fonts (Georgia/Arial fallbacks of Playfair/Inter).
- Colours meet contrast: ivory on navy 16:1, gold-light on navy 8.2:1, gold-dark on ivory 4.7:1.
- Test with Mailgun's preview + Litmus/Email on Acid before launch. Images need absolute HTTPS URLs and `alt` text.
