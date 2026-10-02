/**
 * Pure checkout math. No I/O, so it is unit-testable and shared by
 * /api/pay/initialize (server truth) and the UI (preview only).
 *
 * Hard rules (aplus-agent.md §6): money is integer kobo; prices, delivery fee
 * and totals are always recomputed on the server from the database — the
 * client only sends variant ids, quantities and a delivery option id.
 */

import type { DeliveryRule, FitType, OrderItemSnapshot, Product, ProductVariant } from './types';
import { calculateLineTotal, calculateTotal } from './money';

export interface CheckoutLineInput {
  variant_id: string;
  qty: number;
  fit_type: FitType;
}

export type VariantWithProduct = ProductVariant & { product: Product };

export class CheckoutError extends Error {
  constructor(
    public code:
      | 'EMPTY_CART'
      | 'VARIANT_NOT_FOUND'
      | 'PRODUCT_UNAVAILABLE'
      | 'OUT_OF_STOCK'
      | 'DELIVERY_OPTION_INVALID'
      | 'QTY_INVALID',
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export interface OrderDraft {
  items: Array<Omit<OrderItemSnapshot, 'id' | 'order_id'>>;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  total_kobo: number;
  delivery_rule: DeliveryRule;
}

export const MAX_QTY_PER_LINE = 20;

/**
 * Builds the authoritative order lines from DB variants + published delivery rules.
 * Lines with the same variant and fit type are merged.
 */
export function buildOrderDraft(params: {
  lines: CheckoutLineInput[];
  variants: VariantWithProduct[];
  deliveryRules: DeliveryRule[];
  deliveryOptionId: string;
}): OrderDraft {
  const { variants, deliveryRules, deliveryOptionId } = params;

  const merged = new Map<string, CheckoutLineInput>();
  for (const line of params.lines) {
    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new CheckoutError('QTY_INVALID', `Quantity must be between 1 and ${MAX_QTY_PER_LINE}.`, { variant_id: line.variant_id });
    }
    const key = `${line.variant_id}:${line.fit_type}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, qty: existing.qty + qty } : { ...line, qty });
  }
  if (merged.size === 0) throw new CheckoutError('EMPTY_CART', 'Your bag is empty.');

  const rule = deliveryRules.find((r) => r.id === deliveryOptionId);
  if (!rule) throw new CheckoutError('DELIVERY_OPTION_INVALID', 'Please choose a valid delivery option.');

  const byId = new Map(variants.map((v) => [v.id, v]));
  // Stock is checked per variant across fit types (same physical size row).
  const requestedPerVariant = new Map<string, number>();

  const items: OrderDraft['items'] = [];
  let subtotal = 0;

  for (const line of Array.from(merged.values())) {
    const variant = byId.get(line.variant_id);
    if (!variant) throw new CheckoutError('VARIANT_NOT_FOUND', 'One of the items in your bag is no longer available.', { variant_id: line.variant_id });

    const product = variant.product;
    if (!product || !product.is_visible || product.archived_at) {
      throw new CheckoutError('PRODUCT_UNAVAILABLE', `${product?.name ?? 'An item'} is no longer available.`, { product_id: product?.id });
    }
    if (line.fit_type === 'bespoke' && !product.is_bespoke) {
      throw new CheckoutError('PRODUCT_UNAVAILABLE', `${product.name} is not offered made-to-measure.`, { product_id: product.id });
    }

    // Ready-to-wear consumes stock; bespoke is made to order.
    if (line.fit_type === 'ready_to_wear') {
      const already = requestedPerVariant.get(variant.id) ?? 0;
      const wanted = already + line.qty;
      if (variant.stock < wanted) {
        throw new CheckoutError('OUT_OF_STOCK', `Only ${variant.stock} of ${product.name} (${variant.size_label}) left in stock.`, {
          variant_id: variant.id,
          available: variant.stock,
        });
      }
      requestedPerVariant.set(variant.id, wanted);
    }

    const unit = Math.max(0, Math.floor(product.price_kobo));
    const lineTotal = calculateLineTotal(unit, line.qty);
    subtotal += lineTotal;

    const cover = product.images?.find((i) => i.is_cover) || product.images?.[0];
    items.push({
      product_id: product.id,
      variant_id: variant.id,
      name_snapshot: product.name,
      size_snapshot: variant.size_label,
      fit_type: line.fit_type,
      unit_price_kobo: unit,
      qty: line.qty,
      line_total_kobo: lineTotal,
      image_snapshot: cover?.storage_path,
    });
  }

  const delivery = Math.max(0, Math.floor(rule.fee_kobo));
  return {
    items,
    subtotal_kobo: subtotal,
    delivery_fee_kobo: delivery,
    total_kobo: calculateTotal(subtotal, delivery),
    delivery_rule: rule,
  };
}

/** Unique Paystack reference per attempt: APF-<order_number>-<base36 time><rand>. */
export function newPaymentReference(orderNumber: string, now: number = Date.now()): string {
  const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
  return `${orderNumber}-${now.toString(36)}${rand}`.toUpperCase();
}
