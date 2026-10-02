'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { HttpError, requireAdmin, type AdminUser } from '@/lib/admin-guard';
import {
  addAuditLog,
  cancelOrder,
  deleteReview,
  discardSettingDraft,
  getOrderById,
  getQuoteByReference,
  getStoreSettingRows,
  getStoreSettings,
  markContactHandled,
  publishSetting,
  replyQuote,
  saveSettingDraft,
  updateBookingStatus,
  updateOrderStatus,
  updateQuoteStatus,
  updateReviewStatus,
} from '@/lib/db';
import { sendMailgunMessage, commonVars } from '@/lib/email';
import { renderTemplate } from '@/lib/email-templates';
import { formatNaira } from '@/lib/money';
import type { StoreSettingKey, StoreSettings } from '@/lib/types';

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Wraps an admin mutation: auth, zod errors -> friendly message, audit metadata. */
async function adminAction(fn: (admin: AdminUser, meta: { ip?: string; user_agent?: string }) => Promise<string>): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const h = headers();
    const meta = {
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      user_agent: h.get('user-agent') || undefined,
    };
    const message = await fn(admin, meta);
    return { ok: true, message };
  } catch (err) {
    if (err instanceof HttpError) return { ok: false, message: err.status === 440 ? 'Your admin session timed out. Please sign in again.' : err.message };
    if (err instanceof z.ZodError) return { ok: false, message: err.issues[0]?.message || 'Invalid input' };
    console.error('[admin action] failed:', err);
    return { ok: false, message: err instanceof Error ? err.message : 'Something went wrong' };
  }
}

// ==================== ORDERS ====================

const orderStatusSchema = z.object({
  order_id: z.string().min(1),
  status: z.enum(['paid', 'processing', 'shipped', 'delivered']),
  tracking_url: z.string().trim().url('Tracking link must be a valid URL').max(500).optional().or(z.literal('')),
  internal_note: z.string().trim().max(2000).optional().or(z.literal('')),
});

export async function updateOrderStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = orderStatusSchema.parse(Object.fromEntries(formData));
    const before = await getOrderById(input.order_id);
    if (!before) throw new Error('Order not found');
    if (before.status === 'pending' && input.status !== 'paid') throw new Error('Unpaid orders cannot move to fulfilment. Verify payment first.');
    if (before.status === 'cancelled') throw new Error('Cancelled orders cannot be updated.');

    const after = await updateOrderStatus(input.order_id, {
      status: input.status,
      tracking_url: input.tracking_url || null,
      internal_note: input.internal_note || null,
    });

    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'order.status_update',
      entity: 'orders',
      entity_id: input.order_id,
      before: { status: before.status, tracking_url: before.tracking_url, internal_note: before.internal_note },
      after: { status: after.status, tracking_url: after.tracking_url, internal_note: after.internal_note },
      ...meta,
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${input.order_id}`);
    revalidatePath('/admin');
    return `Order ${after.order_number} marked ${after.status}.`;
  });
}

const cancelOrderSchema = z.object({
  order_id: z.string().min(1),
  reason: z.string().trim().min(3, 'Please give a short reason').max(500),
});

export async function cancelOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = cancelOrderSchema.parse(Object.fromEntries(formData));
    const before = await getOrderById(input.order_id);
    if (!before) throw new Error('Order not found');
    if (before.status === 'shipped' || before.status === 'delivered') throw new Error('Shipped or delivered orders cannot be cancelled.');

    const after = await cancelOrder(input.order_id, input.reason);
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'order.cancel',
      entity: 'orders',
      entity_id: input.order_id,
      before: { status: before.status },
      after: { status: after.status, reason: input.reason, paid: before.payment?.status === 'success' },
      ...meta,
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${input.order_id}`);
    return before.payment?.status === 'success'
      ? `Order ${after.order_number} cancelled. Remember to issue the refund from Payments.`
      : `Order ${after.order_number} cancelled.`;
  });
}

// ==================== QUOTES ====================

const replyQuoteSchema = z.object({
  quote_id: z.string().min(1),
  reference: z.string().min(1),
  quoted_price_naira: z.coerce.number().positive('Enter the quoted price in Naira').max(100_000_000),
  ready_by: z.string().min(4, 'Choose a ready-by date'),
  owner_message: z.string().trim().min(10, 'Add a short message for the customer').max(3000),
});

export async function replyQuoteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = replyQuoteSchema.parse(Object.fromEntries(formData));
    const before = await getQuoteByReference(input.reference);
    if (!before) throw new Error('Quote not found');

    const priceKobo = Math.round(input.quoted_price_naira * 100);
    const quote = await replyQuote(input.quote_id, priceKobo, input.ready_by, input.owner_message);

    // Plain, branded reply email (reuses the design-pack chrome via the quotation template's variables).
    const settings = await getStoreSettings();
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const html = renderTemplate(QUOTE_REPLY_TEMPLATE, {
      ...commonVars(settings),
      customer_name: quote.customer_name,
      quote_reference: quote.reference,
      garment: quote.garment,
      quoted_price: formatNaira(priceKobo),
      ready_by: new Date(input.ready_by).toLocaleDateString('en-NG', { dateStyle: 'long' }),
      owner_message: input.owner_message,
      booking_url: `${site}/booking`,
    });
    const emailSent = await sendMailgunMessage({
      to: quote.customer_email,
      subject: `Your A-Plus quotation ${quote.reference}: ${formatNaira(priceKobo)}`,
      html,
      tag: 'quotation-reply',
      idempotencyKey: `quote-reply-${quote.id}-${Date.now()}`,
      replyTo: settings.contact.email,
    });

    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'quote.reply',
      entity: 'quotes',
      entity_id: quote.id,
      before: { status: before.status },
      after: { status: quote.status, quoted_price_kobo: priceKobo, ready_by: input.ready_by, email_sent: emailSent },
      ...meta,
    });

    revalidatePath('/admin/requests');
    return emailSent ? `Quotation sent to ${quote.customer_email}.` : `Quotation saved. Email not sent (Mailgun not configured) — share it via ${quote.contact_preference}.`;
  });
}

const quoteStatusSchema = z.object({
  quote_id: z.string().min(1),
  status: z.enum(['accepted', 'rejected', 'requested']),
});

export async function updateQuoteStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = quoteStatusSchema.parse(Object.fromEntries(formData));
    const quote = await updateQuoteStatus(input.quote_id, input.status);
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'quote.status_update',
      entity: 'quotes',
      entity_id: quote.id,
      after: { status: quote.status },
      ...meta,
    });
    revalidatePath('/admin/requests');
    return `Quote ${quote.reference} marked ${quote.status.replace('_', ' ')}.`;
  });
}

// ==================== BOOKINGS ====================

const bookingSchema = z.object({
  booking_id: z.string().min(1),
  status: z.enum(['confirmed', 'rejected', 'rescheduled', 'cancelled']),
  new_starts_at: z.string().optional().or(z.literal('')),
});

export async function updateBookingAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = bookingSchema.parse(Object.fromEntries(formData));
    if (input.status === 'rescheduled' && !input.new_starts_at) throw new Error('Choose the new date and time to reschedule.');
    const iso = input.new_starts_at ? new Date(input.new_starts_at).toISOString() : undefined;
    const booking = await updateBookingStatus(input.booking_id, input.status, input.status === 'rescheduled' ? iso : undefined);
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: `booking.${input.status}`,
      entity: 'bookings',
      entity_id: booking.id,
      after: { status: booking.status, starts_at: booking.starts_at },
      ...meta,
    });
    revalidatePath('/admin/requests');
    return `Booking ${booking.reference} ${booking.status}.`;
  });
}

// ==================== CONTACT ====================

export async function markContactHandledAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = z.object({ id: z.string().min(1), handled: z.enum(['true', 'false']) }).parse(Object.fromEntries(formData));
    await markContactHandled(input.id, input.handled === 'true');
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'contact.handled',
      entity: 'contact_messages',
      entity_id: input.id,
      after: { handled: input.handled === 'true' },
      ...meta,
    });
    revalidatePath('/admin/requests');
    return input.handled === 'true' ? 'Message marked as handled.' : 'Message reopened.';
  });
}

// ==================== REVIEWS ====================

const reviewSchema = z.object({
  review_id: z.string().min(1),
  decision: z.enum(['approved', 'hidden', 'delete']),
});

export async function moderateReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = reviewSchema.parse(Object.fromEntries(formData));
    if (input.decision === 'delete') {
      await deleteReview(input.review_id);
    } else {
      await updateReviewStatus(input.review_id, input.decision);
    }
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: `review.${input.decision}`,
      entity: 'reviews',
      entity_id: input.review_id,
      after: { decision: input.decision },
      ...meta,
    });
    revalidatePath('/admin/reviews');
    revalidatePath('/reviews');
    return input.decision === 'delete' ? 'Review deleted.' : input.decision === 'approved' ? 'Review published.' : 'Review hidden.';
  });
}

// ==================== STORE CONTENT ====================

const settingKeySchema = z.enum(['homepage_banners', 'about', 'contact', 'social', 'fx_rates', 'delivery_rules']);

const bannerSchema = z.object({
  id: z.string().min(1),
  headline: z.string().trim().min(2).max(120),
  sub: z.string().trim().max(300),
  cta_label: z.string().trim().min(1).max(40),
  cta_href: z.string().trim().min(1).max(300),
  secondary_label: z.string().trim().max(40).optional(),
  secondary_href: z.string().trim().max(300).optional(),
  image_path: z.string().trim().min(1).max(500),
  visible: z.boolean(),
  sort_order: z.number().int().min(0),
});

const settingValueSchemas: Record<StoreSettingKey, z.ZodTypeAny> = {
  homepage_banners: z.array(bannerSchema).max(6),
  about: z.object({
    headline: z.string().trim().min(2).max(160),
    story_html: z.string().trim().max(10_000),
    years: z.number().int().min(0).max(100),
    product_count: z.string().trim().max(20),
    happy_clients: z.string().trim().max(20),
  }),
  contact: z.object({
    whatsapp: z.string().trim().regex(/^\+?[\d\s-]{10,16}$/, 'WhatsApp must be an international number like +2347071374515'),
    phone: z.string().trim().regex(/^\+?[\d\s-]{10,16}$/, 'Phone must be an international number'),
    alt_phone: z.string().trim().max(32).optional(),
    email: z.string().trim().email(),
    address: z.string().trim().min(5).max(300),
    hours: z.string().trim().min(3).max(120),
  }),
  social: z.object({
    instagram: z.string().trim().url().or(z.literal('')),
    facebook: z.string().trim().url().or(z.literal('')),
    tiktok: z.string().trim().url().or(z.literal('')),
    whatsapp_channel: z.string().trim().url().or(z.literal('')),
  }),
  fx_rates: z.object({
    USD: z.number().positive().max(100_000),
    GBP: z.number().positive().max(100_000),
  }),
  delivery_rules: z
    .array(
      z.object({
        id: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'Rule id: lowercase letters, numbers, underscores'),
        label: z.string().trim().min(2).max(120),
        fee_kobo: z.number().int().min(0).max(100_000_000),
        eta: z.string().trim().min(2).max(80),
      })
    )
    .min(1, 'Keep at least one delivery option')
    .max(10)
    .refine((rules) => new Set(rules.map((r) => r.id)).size === rules.length, 'Delivery rule ids must be unique'),
};

function parseSettingValue<K extends StoreSettingKey>(key: K, raw: string): StoreSettings[K] {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('The content is not valid JSON.');
  }
  return settingValueSchemas[key].parse(json) as StoreSettings[K];
}

const settingFormSchema = z.object({
  key: settingKeySchema,
  value_json: z.string().min(2),
  intent: z.enum(['draft', 'publish', 'discard']),
});

export async function saveSettingAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return adminAction(async (admin, meta) => {
    const input = settingFormSchema.parse(Object.fromEntries(formData));
    const rows = await getStoreSettingRows();
    const before = rows.find((r) => r.key === input.key);

    if (input.intent === 'discard') {
      await discardSettingDraft(input.key);
      await addAuditLog({ actor_id: admin.id, actor_email: admin.email, action: 'settings.discard_draft', entity: 'store_settings', entity_id: input.key, ...meta });
      revalidatePath('/admin/content');
      return 'Draft discarded.';
    }

    const value = parseSettingValue(input.key, input.value_json);

    if (input.intent === 'draft') {
      await saveSettingDraft(input.key, value, admin.email);
      await addAuditLog({
        actor_id: admin.id,
        actor_email: admin.email,
        action: 'settings.save_draft',
        entity: 'store_settings',
        entity_id: input.key,
        after: value as unknown as Record<string, unknown>,
        ...meta,
      });
      revalidatePath('/admin/content');
      return 'Draft saved. It is not live until you publish.';
    }

    await publishSetting(input.key, value, admin.email);
    await addAuditLog({
      actor_id: admin.id,
      actor_email: admin.email,
      action: 'settings.publish',
      entity: 'store_settings',
      entity_id: input.key,
      before: (before?.value as unknown as Record<string, unknown>) ?? null,
      after: value as unknown as Record<string, unknown>,
      ...meta,
    });
    revalidatePath('/', 'layout');
    revalidatePath('/admin/content');
    return `${input.key.replace('_', ' ')} published to the live store.`;
  });
}

/** Branded quotation reply. Kept inline (not in the design pack) and rendered with the same renderer. */
const QUOTE_REPLY_TEMPLATE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your quotation</title></head>
<body style="margin:0;padding:0;background:#EDE9DF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDE9DF;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#FAF7F0;">
 <tr><td align="center" style="background:#0E1B33;padding:24px 0 18px 0;border-bottom:3px solid #B8923A;"><img src="{{logo_url}}" width="72" height="72" alt="A-Plus Fashion Home" style="display:block;border-radius:36px;"><div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;color:#D4AF5A;padding-top:10px;">FASHION HOME</div></td></tr>
 <tr><td style="padding:36px 40px 8px 40px;font-family:Arial,Helvetica,sans-serif;"><div style="font-size:11px;letter-spacing:2.5px;color:#8A6A1F;font-weight:bold;text-align:center;">YOUR QUOTATION</div><div style="height:8px;"></div><div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:34px;color:#0E1B33;text-align:center;">Hello, {{customer_name}}.</div><p style="margin:12px 0 0 0;font-size:15px;line-height:24px;color:#4B5565;text-align:center;">Thank you for your patience. Here is our quotation for your {{garment}} (ref. {{quote_reference}}).</p></td></tr>
 <tr><td style="padding:16px 40px 0 40px;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E9E7E3;"><tr><td style="padding:14px 20px;"><div style="font-size:10.5px;letter-spacing:1.4px;color:#8A6A1F;font-weight:bold;">QUOTED PRICE</div><div style="font-size:22px;font-weight:bold;color:#0E1B33;padding-top:4px;">{{quoted_price}}</div></td><td align="right" style="padding:14px 20px;"><div style="font-size:10.5px;letter-spacing:1.4px;color:#8A6A1F;font-weight:bold;">READY BY</div><div style="font-size:15px;font-weight:bold;color:#0E1B33;padding-top:4px;">{{ready_by}}</div></td></tr></table></td></tr>
 <tr><td style="padding:24px 40px 0 40px;font-family:Arial,Helvetica,sans-serif;"><div style="background:#F2EDE2;padding:20px;font-size:14px;line-height:23px;color:#1B2230;white-space:pre-line;">{{owner_message}}</div></td></tr>
 <tr><td style="padding:28px 40px 36px 40px;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" bgcolor="#0E1B33" style="border-radius:3px;"><a href="{{booking_url}}" style="display:inline-block;min-width:240px;padding:16px 24px;font-size:15px;font-weight:bold;color:#FAF7F0;text-decoration:none;" target="_blank">Book your fitting</a></td></tr></table><div style="height:12px;"></div><table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" bgcolor="#B8923A" style="border-radius:3px;"><a href="{{whatsapp_url}}" style="display:inline-block;min-width:240px;padding:16px 24px;font-size:15px;font-weight:bold;color:#0E1B33;text-decoration:none;" target="_blank">Accept or discuss on WhatsApp</a></td></tr></table></td></tr>
 <tr><td align="center" style="background:#0E1B33;border-top:2px solid #B8923A;padding:28px 40px;font-family:Arial,Helvetica,sans-serif;"><div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#FAF7F0;">A-Plus Fashion Home</div><div style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#D4AF5A;padding-top:2px;">Wear Class, Live Bold</div><div style="font-size:12px;line-height:19px;color:#C5CBD9;padding-top:14px;">{{shop_address}}<br>WhatsApp {{whatsapp_number}} &middot; {{shop_email}}</div></td></tr>
</table></td></tr></table></body></html>`;
