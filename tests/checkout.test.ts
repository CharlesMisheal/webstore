import { describe, it, expect } from 'vitest';
import { buildOrderDraft, CheckoutError, newPaymentReference, type VariantWithProduct } from '../lib/checkout';
import { DEFAULT_STORE_SETTINGS } from '../lib/store-defaults';
import type { Product } from '../lib/types';

const product = (over: Partial<Product> = {}): Product => ({
  id: 'prod_1',
  name: 'Navy Three-Piece Suit',
  slug: 'navy-three-piece-suit',
  description: '',
  price_kobo: 18_500_000,
  is_bespoke: true,
  is_featured: false,
  is_visible: true,
  images: [{ id: 'img1', product_id: 'prod_1', storage_path: '/images/a.jpg', sort_order: 1, is_cover: true }],
  variants: [],
  created_at: '2026-01-01T00:00:00Z',
  ...over,
});

const variant = (over: Partial<VariantWithProduct> = {}): VariantWithProduct => ({
  id: 'var_40r',
  product_id: 'prod_1',
  size_label: '40R',
  stock: 3,
  product: product(),
  ...over,
});

const rules = DEFAULT_STORE_SETTINGS.delivery_rules;

describe('buildOrderDraft — server-side pricing', () => {
  it('recomputes prices, delivery fee and total from the DB, ignoring anything the client might claim', () => {
    const draft = buildOrderDraft({
      lines: [{ variant_id: 'var_40r', qty: 2, fit_type: 'ready_to_wear' }],
      variants: [variant()],
      deliveryRules: rules,
      deliveryOptionId: 'del_lagos_ogun',
    });
    expect(draft.subtotal_kobo).toBe(37_000_000);
    expect(draft.delivery_fee_kobo).toBe(450_000);
    expect(draft.total_kobo).toBe(37_450_000);
    expect(draft.items[0]).toMatchObject({ name_snapshot: 'Navy Three-Piece Suit', size_snapshot: '40R', unit_price_kobo: 18_500_000, line_total_kobo: 37_000_000 });
  });

  it('recalculates the delivery fee when the option changes (pickup = free, international = ₦45,000)', () => {
    const base = { lines: [{ variant_id: 'var_40r', qty: 1, fit_type: 'bespoke' as const }], variants: [variant()], deliveryRules: rules };
    expect(buildOrderDraft({ ...base, deliveryOptionId: 'del_pickup' }).total_kobo).toBe(18_500_000);
    expect(buildOrderDraft({ ...base, deliveryOptionId: 'del_intl' }).total_kobo).toBe(18_500_000 + 4_500_000);
    expect(buildOrderDraft({ ...base, deliveryOptionId: 'del_nationwide' }).delivery_fee_kobo).toBe(750_000);
  });

  it('rejects an unknown delivery option instead of defaulting to a fee', () => {
    expect(() =>
      buildOrderDraft({ lines: [{ variant_id: 'var_40r', qty: 1, fit_type: 'bespoke' }], variants: [variant()], deliveryRules: rules, deliveryOptionId: 'del_free_hack' })
    ).toThrowError(CheckoutError);
  });

  it('merges duplicate lines and enforces stock for ready-to-wear', () => {
    const lines = [
      { variant_id: 'var_40r', qty: 2, fit_type: 'ready_to_wear' as const },
      { variant_id: 'var_40r', qty: 2, fit_type: 'ready_to_wear' as const },
    ];
    expect(() => buildOrderDraft({ lines, variants: [variant({ stock: 3 })], deliveryRules: rules, deliveryOptionId: 'del_pickup' })).toThrowError(/Only 3/);
    const ok = buildOrderDraft({ lines, variants: [variant({ stock: 4 })], deliveryRules: rules, deliveryOptionId: 'del_pickup' });
    expect(ok.items).toHaveLength(1);
    expect(ok.items[0].qty).toBe(4);
  });

  it('does not consume stock for bespoke lines', () => {
    const draft = buildOrderDraft({
      lines: [{ variant_id: 'var_40r', qty: 5, fit_type: 'bespoke' }],
      variants: [variant({ stock: 0 })],
      deliveryRules: rules,
      deliveryOptionId: 'del_pickup',
    });
    expect(draft.items[0].qty).toBe(5);
  });

  it('rejects hidden or deleted products and unknown variants', () => {
    const hidden = variant({ product: product({ is_visible: false }) });
    expect(() => buildOrderDraft({ lines: [{ variant_id: 'var_40r', qty: 1, fit_type: 'bespoke' }], variants: [hidden], deliveryRules: rules, deliveryOptionId: 'del_pickup' })).toThrowError(/no longer available/);
    expect(() => buildOrderDraft({ lines: [{ variant_id: 'nope', qty: 1, fit_type: 'bespoke' }], variants: [variant()], deliveryRules: rules, deliveryOptionId: 'del_pickup' })).toThrowError(CheckoutError);
  });

  it('rejects bad quantities and empty carts', () => {
    expect(() => buildOrderDraft({ lines: [{ variant_id: 'var_40r', qty: 0, fit_type: 'bespoke' }], variants: [variant()], deliveryRules: rules, deliveryOptionId: 'del_pickup' })).toThrowError(/Quantity/);
    expect(() => buildOrderDraft({ lines: [], variants: [], deliveryRules: rules, deliveryOptionId: 'del_pickup' })).toThrowError(/empty/);
  });
});

describe('newPaymentReference', () => {
  it('is unique per attempt and embeds the order number', () => {
    const a = newPaymentReference('APF-261002-1234', 1_000);
    const b = newPaymentReference('APF-261002-1234', 2_000);
    expect(a).toMatch(/^APF-261002-1234-/);
    expect(a).not.toBe(b);
  });
});
