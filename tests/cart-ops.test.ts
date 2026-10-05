import { describe, it, expect } from 'vitest';
import { applyOps, lineId, mergeItems, toWireOp, type CartOp } from '../lib/cart-ops';
import type { CartItem, FitType } from '../lib/types';

function item(variant: string, qty: number, fit: FitType = 'ready_to_wear'): CartItem {
  return {
    id: lineId(variant, fit),
    product_id: `p_${variant}`,
    variant_id: variant,
    name: `Suit ${variant}`,
    size_label: '40R',
    fit_type: fit,
    unit_price_kobo: 10_000_00,
    qty,
    image_url: '',
    slug: `suit-${variant}`,
  };
}

describe('cart ops', () => {
  it('add merges the same variant + fit and caps at 20', () => {
    const out = applyOps([item('v1', 15)], [{ type: 'add', item: item('v1', 10) }]);
    expect(out).toHaveLength(1);
    expect(out[0].qty).toBe(20);
  });

  it('keeps ready-to-wear and bespoke of the same variant as separate lines', () => {
    const out = applyOps([item('v1', 1)], [{ type: 'add', item: item('v1', 1, 'bespoke') }]);
    expect(out.map((i) => i.id).sort()).toEqual(['v1_bespoke', 'v1_ready_to_wear']);
  });

  it('set, remove and clear', () => {
    const base = [item('v1', 1), item('v2', 2)];
    expect(applyOps(base, [{ type: 'set', variant_id: 'v2', fit_type: 'ready_to_wear', qty: 5 }])[1].qty).toBe(5);
    expect(applyOps(base, [{ type: 'set', variant_id: 'v2', fit_type: 'ready_to_wear', qty: 0 }])).toHaveLength(1);
    expect(applyOps(base, [{ type: 'remove', variant_id: 'v1', fit_type: 'ready_to_wear' }]).map((i) => i.variant_id)).toEqual(['v2']);
    expect(applyOps(base, [{ type: 'clear' }])).toEqual([]);
  });

  it('pending local changes replay on top of a fresher server cart (another device added v3)', () => {
    const server = [item('v1', 1), item('v3', 1)];
    const pending: CartOp[] = [{ type: 'add', item: item('v2', 1) }];
    expect(applyOps(server, pending).map((i) => i.variant_id)).toEqual(['v1', 'v3', 'v2']);
  });

  it('normalises legacy timestamped ids when merging cached items', () => {
    const legacy = { ...item('v1', 1), id: 'v1_ready_to_wear_1700000000000' };
    expect(mergeItems([legacy])[0].id).toBe('v1_ready_to_wear');
  });

  it('wire format never carries prices or display fields', () => {
    expect(toWireOp({ type: 'add', item: item('v1', 2) })).toEqual({ type: 'add', variant_id: 'v1', fit_type: 'ready_to_wear', qty: 2 });
  });
});
