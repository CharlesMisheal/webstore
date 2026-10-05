import type { CartItem, FitType } from './types';

export const MAX_LINE_QTY = 20;

/** A line-level cart change. `add` carries the full item so it can be shown before the server confirms it. */
export type CartOp =
  | { type: 'add'; item: CartItem }
  | { type: 'set'; variant_id: string; fit_type: FitType; qty: number }
  | { type: 'remove'; variant_id: string; fit_type: FitType }
  | { type: 'clear' };

export const lineId = (variantId: string, fitType: FitType) => `${variantId}_${fitType}`;

/** Merges lines that share variant + fit, capping quantity. Later lists win on display fields. */
export function mergeItems(...lists: CartItem[][]): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const list of lists) {
    for (const item of list) {
      const id = lineId(item.variant_id, item.fit_type);
      const prev = byId.get(id);
      byId.set(id, { ...item, id, qty: Math.min(MAX_LINE_QTY, (prev?.qty ?? 0) + item.qty) });
    }
  }
  return Array.from(byId.values());
}

export function applyOps(base: CartItem[], ops: CartOp[]): CartItem[] {
  let items = base;
  for (const op of ops) {
    if (op.type === 'clear') items = [];
    else if (op.type === 'add') items = mergeItems(items, [op.item]);
    else {
      const id = lineId(op.variant_id, op.fit_type);
      items =
        op.type === 'remove' || op.qty <= 0
          ? items.filter((i) => i.id !== id)
          : items.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_LINE_QTY, op.qty) } : i));
    }
  }
  return items;
}

/** What the API accepts: identifiers and quantities only, never prices. */
export function toWireOp(op: CartOp) {
  if (op.type === 'add') return { type: 'add' as const, variant_id: op.item.variant_id, fit_type: op.item.fit_type, qty: op.item.qty };
  return op;
}
