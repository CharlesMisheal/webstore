/**
 * Transactional email for A-Plus Fashion Home (Mailgun REST API, inline HTML).
 *
 * The three templates come from the design pack (/emails). Callers are
 * responsible for the "exactly once" guarantee via the DB claim functions
 * (claim_order_confirmation / claim_welcome_email); this module additionally
 * passes a Mailgun idempotency key so a retried request cannot double-send.
 *
 * When Mailgun is not configured the send is logged and reported as skipped
 * (returns false) so the caller can decide whether to roll back its claim.
 */

import { Order, Quote, StoreSettings } from './types';
import { formatNaira } from './money';
import { formatPhoneDisplay, whatsappUrl } from './whatsapp';
import { htmlToText, renderEmail, TemplateVars } from './email-templates';

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  from: string;
  baseUrl: string;
}

export function getMailgunConfig(): MailgunConfig | null {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain || apiKey.startsWith('sample') || apiKey.startsWith('your_')) return null;
  return {
    apiKey,
    domain,
    from: process.env.MAILGUN_FROM || `A-Plus Fashion Home <orders@${domain}>`,
    // EU domains must use api.eu.mailgun.net.
    baseUrl: process.env.MAILGUN_API_BASE || 'https://api.mailgun.net',
  };
}

export const isEmailConfigured = () => getMailgunConfig() !== null;

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/** Variables shared by every template's header/footer. */
export function commonVars(settings: StoreSettings): TemplateVars {
  const site = siteUrl();
  return {
    logo_url: `${site}/images/logo.png`,
    site_url: site,
    shop_url: `${site}/shop`,
    quote_url: `${site}/quote`,
    booking_url: `${site}/booking`,
    shop_address: settings.contact.address,
    shop_email: settings.contact.email,
    whatsapp_number: formatPhoneDisplay(settings.contact.whatsapp),
    whatsapp_url: whatsappUrl(settings.contact.whatsapp),
    instagram_url: settings.social.instagram || site,
  };
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  tag: string;
  idempotencyKey?: string;
  replyTo?: string;
}

export async function sendMailgunMessage(args: SendArgs): Promise<boolean> {
  const cfg = getMailgunConfig();
  if (!cfg) {
    console.warn(`[email] Mailgun not configured — skipped "${args.subject}" to ${args.to}`);
    return false;
  }

  const body = new URLSearchParams({
    from: cfg.from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: htmlToText(args.html),
    'o:tag': args.tag,
    'o:tracking-clicks': 'no',
  });
  if (args.replyTo) body.set('h:Reply-To', args.replyTo);
  if (args.idempotencyKey) body.set('h:X-Idempotency-Key', args.idempotencyKey);

  try {
    const res = await fetch(`${cfg.baseUrl}/v3/${cfg.domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${cfg.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!res.ok) {
      console.error(`[email] Mailgun ${res.status} for "${args.subject}":`, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Mailgun request failed:', err);
    return false;
  }
}

// ==================== Templates ====================

function fitLabel(fit: string) {
  return fit === 'bespoke' ? 'Made to measure' : 'Ready to wear';
}

export async function sendOrderConfirmationEmail(order: Order, settings: StoreSettings): Promise<boolean> {
  const payment = order.payment;
  const rule = settings.delivery_rules.find((r) => r.id === order.shipping_address.deliveryOptionId);
  const site = siteUrl();
  const addr = order.shipping_address;

  const html = renderEmail('order-confirmation', {
    ...commonVars(settings),
    customer_name: order.customer_name,
    order_number: order.order_number,
    order_date: new Date(order.placed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' }),
    items: order.items.map((i) => ({
      name: i.name_snapshot,
      size: i.size_snapshot,
      fit_type: fitLabel(i.fit_type),
      qty: i.qty,
      line_total: formatNaira(i.line_total_kobo),
      image_url: i.image_snapshot
        ? i.image_snapshot.startsWith('http')
          ? i.image_snapshot
          : `${site}${i.image_snapshot}`
        : `${site}/images/logo.png`,
    })),
    subtotal: formatNaira(order.subtotal_kobo),
    delivery_method: addr.deliveryMethod,
    delivery_fee: order.delivery_fee_kobo === 0 ? 'Free' : formatNaira(order.delivery_fee_kobo),
    total: formatNaira(order.total_kobo),
    payment_channel: payment?.channel || 'Paystack',
    payment_reference: payment?.reference || '—',
    delivery_address: [addr.address, addr.city, addr.state, addr.country].filter(Boolean).join(', '),
    estimated_delivery: rule?.eta || 'We will confirm by WhatsApp',
    tracking_url: `${site}/track?order=${encodeURIComponent(order.order_number)}`,
  });

  return sendMailgunMessage({
    to: order.customer_email,
    subject: `Order ${order.order_number} confirmed — thank you, ${order.customer_name}`,
    html,
    tag: 'order-confirmation',
    idempotencyKey: `order-confirmation-${order.id}`,
    replyTo: settings.contact.email,
  });
}

export async function sendWelcomeEmail(args: { customerName: string; customerEmail: string; settings: StoreSettings }): Promise<boolean> {
  const html = renderEmail('welcome', {
    ...commonVars(args.settings),
    customer_name: args.customerName || 'there',
  });
  return sendMailgunMessage({
    to: args.customerEmail,
    subject: `Welcome to A-Plus Fashion Home, ${args.customerName || 'friend'}`,
    html,
    tag: 'welcome',
    idempotencyKey: `welcome-${args.customerEmail.toLowerCase()}`,
    replyTo: args.settings.contact.email,
  });
}

export async function sendQuoteReceivedEmail(quote: Quote, settings: StoreSettings, hasMeasurements = false): Promise<boolean> {
  const budget =
    quote.budget_min_kobo || quote.budget_max_kobo
      ? `${formatNaira(quote.budget_min_kobo || 0)} – ${formatNaira(quote.budget_max_kobo || quote.budget_min_kobo || 0)}`
      : 'To be discussed';

  const html = renderEmail('quotation-received', {
    ...commonVars(settings),
    customer_name: quote.customer_name,
    quote_reference: quote.reference,
    garment: quote.garment,
    occasion: quote.occasion,
    event_date: quote.event_date ? new Date(quote.event_date).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : 'Not specified',
    budget,
    measurements_status: hasMeasurements ? 'Provided' : 'To be taken at fitting',
    photo_count: quote.photo_paths?.length ?? 0,
    contact_preference: quote.contact_preference,
  });

  return sendMailgunMessage({
    to: quote.customer_email,
    subject: `We've received your quote request ${quote.reference}`,
    html,
    tag: 'quotation-received',
    idempotencyKey: `quote-received-${quote.id}`,
    replyTo: settings.contact.email,
  });
}
