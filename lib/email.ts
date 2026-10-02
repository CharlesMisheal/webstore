/**
 * Email service for A-Plus Fashion Home.
 * Handles transactional emails via Mailgun using templates defined in developer-note.md.
 */

import { Order, Quote } from './types';
import { formatNaira } from './money';

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  // In test or development without active Mailgun credentials, log and simulate success
  if (!apiKey || !domain || apiKey.startsWith('sample')) {
    console.log(`[Mailgun Mock] Order Confirmation Email sent to ${order.customer_email} for order ${order.order_number}`);
    return true;
  }

  try {
    const from = process.env.MAILGUN_FROM || `A-Plus Fashion Home <orders@${domain}>`;
    const body = new URLSearchParams({
      from,
      to: order.customer_email,
      subject: `Order ${order.order_number} confirmed — thank you, ${order.customer_name}`,
      template: 'order-confirmation',
      'h:X-Mailgun-Variables': JSON.stringify({
        customer_name: order.customer_name,
        order_number: order.order_number,
        order_date: new Date(order.placed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' }),
        subtotal: formatNaira(order.subtotal_kobo),
        delivery_fee: formatNaira(order.delivery_fee_kobo),
        total: formatNaira(order.total_kobo),
        delivery_method: order.shipping_address.deliveryMethod,
        delivery_address: `${order.shipping_address.address}, ${order.shipping_address.city}, ${order.shipping_address.state}`,
        tracking_url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/track?order=${order.order_number}`,
      }),
      'o:tag': 'order-confirmation',
      'h:Idempotency-Key': `order-confirmation-${order.id}`,
    });

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return res.ok;
  } catch (err) {
    console.error('Mailgun order confirmation error:', err);
    return false;
  }
}

export async function sendWelcomeEmail(customerName: string, customerEmail: string): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain || apiKey.startsWith('sample')) {
    console.log(`[Mailgun Mock] Welcome Email sent to ${customerEmail}`);
    return true;
  }

  try {
    const from = process.env.MAILGUN_FROM || `A-Plus Fashion Home <orders@${domain}>`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const body = new URLSearchParams({
      from,
      to: customerEmail,
      subject: `Welcome to A-Plus Fashion Home, ${customerName}`,
      template: 'welcome',
      'h:X-Mailgun-Variables': JSON.stringify({
        customer_name: customerName,
        shop_url: `${siteUrl}/shop`,
        quote_url: `${siteUrl}/quote`,
        booking_url: `${siteUrl}/booking`,
        whatsapp_number: '+2347071374515',
        whatsapp_url: 'https://wa.me/2347071374515',
      }),
      'o:tag': 'welcome',
    });

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return res.ok;
  } catch (err) {
    console.error('Mailgun welcome email error:', err);
    return false;
  }
}

export async function sendQuoteReceivedEmail(quote: Quote): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain || apiKey.startsWith('sample')) {
    console.log(`[Mailgun Mock] Quote Received Email sent to ${quote.customer_email} for reference ${quote.reference}`);
    return true;
  }

  try {
    const from = process.env.MAILGUN_FROM || `A-Plus Fashion Home <orders@${domain}>`;
    const body = new URLSearchParams({
      from,
      to: quote.customer_email,
      subject: `We've received your quote request ${quote.reference}`,
      template: 'quotation-received',
      'h:X-Mailgun-Variables': JSON.stringify({
        customer_name: quote.customer_name,
        quote_reference: quote.reference,
        garment: quote.garment,
        occasion: quote.occasion,
        event_date: quote.event_date || 'Not specified',
        budget: quote.budget_min_kobo ? `${formatNaira(quote.budget_min_kobo)} – ${formatNaira(quote.budget_max_kobo || 0)}` : 'Custom discussion',
        contact_preference: quote.contact_preference,
      }),
      'o:tag': 'quotation-received',
    });

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return res.ok;
  } catch (err) {
    console.error('Mailgun quote received email error:', err);
    return false;
  }
}
