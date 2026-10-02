import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settleCharge, type SettleDeps } from '../lib/payments';
import { verifyPaystackSignature } from '../lib/paystack';
import { DEFAULT_STORE_SETTINGS } from '../lib/store-defaults';
import type { Order, Payment } from '../lib/types';
import crypto from 'crypto';

const order: Order = {
  id: 'ord_1',
  order_number: 'APF-261002-1234',
  customer_name: 'Tobi Adeleke',
  customer_email: 'tobi@example.com',
  customer_phone: '+2348030000000',
  status: 'pending',
  subtotal_kobo: 18_500_000,
  delivery_fee_kobo: 450_000,
  total_kobo: 18_950_000,
  currency: 'NGN',
  shipping_address: {
    fullName: 'Tobi Adeleke',
    email: 'tobi@example.com',
    phone: '+2348030000000',
    address: '1 Street',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    deliveryOptionId: 'del_lagos_ogun',
    deliveryMethod: 'Lagos & Ogun Express Courier',
  },
  placed_at: '2026-10-02T10:00:00Z',
  items: [],
};

const payment: Payment & { order: Order | null } = {
  reference: 'APF-261002-1234-ABC',
  order_id: 'ord_1',
  provider: 'paystack',
  amount_kobo: 18_950_000,
  status: 'initialized',
  refund_status: 'none',
  created_at: '2026-10-02T10:00:00Z',
  order,
};

function makeDeps(over: Partial<SettleDeps> = {}) {
  // Simulates the DB claim: first call wins, later calls return null.
  let claimed = false;
  let confirmationClaimed = false;
  const deps: SettleDeps = {
    getPaymentByReference: vi.fn(async (ref) => (ref === payment.reference ? payment : null)),
    applyPaidOrder: vi.fn(async () => {
      if (claimed) return null;
      claimed = true;
      return order.id;
    }),
    markPaymentStatus: vi.fn(async () => {}),
    claimOrderConfirmation: vi.fn(async () => {
      if (confirmationClaimed) return false;
      confirmationClaimed = true;
      return true;
    }),
    getOrderById: vi.fn(async () => ({ ...order, status: 'paid' as const })),
    getStoreSettings: vi.fn(async () => DEFAULT_STORE_SETTINGS),
    sendOrderConfirmationEmail: vi.fn(async () => true),
    addAuditLog: vi.fn(async () => {}),
    ...over,
  };
  return deps;
}

const success = { reference: payment.reference, amount: 18_950_000, currency: 'NGN', status: 'success' as const, channel: 'card' };

describe('settleCharge', () => {
  let deps: SettleDeps;
  beforeEach(() => {
    deps = makeDeps();
  });

  it('marks the order paid and sends exactly one confirmation email', async () => {
    const out = await settleCharge(deps, success, 'webhook');
    expect(out).toMatchObject({ kind: 'paid', orderId: 'ord_1', emailSent: true });
    expect(deps.applyPaidOrder).toHaveBeenCalledWith(payment.reference, 'card', 18_950_000, success);
    expect(deps.sendOrderConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: webhook + verify for the same reference only process once', async () => {
    const first = await settleCharge(deps, success, 'webhook');
    const second = await settleCharge(deps, success, 'verify');
    const third = await settleCharge(deps, success, 'webhook');
    expect(first.kind).toBe('paid');
    expect(second.kind).toBe('already_paid');
    expect(third.kind).toBe('already_paid');
    expect(deps.sendOrderConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it('rejects an underpaid charge (amount mismatch) and leaves the order pending', async () => {
    const out = await settleCharge(deps, { ...success, amount: 1_000_000 }, 'webhook');
    expect(out).toEqual({ kind: 'amount_mismatch', expected: 18_950_000, received: 1_000_000 });
    expect(deps.applyPaidOrder).not.toHaveBeenCalled();
    expect(deps.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(deps.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'payment.amount_mismatch' }));
  });

  it('accepts an overpayment (never leaves a customer who paid more unfulfilled)', async () => {
    const out = await settleCharge(deps, { ...success, amount: 19_000_000 }, 'webhook');
    expect(out.kind).toBe('paid');
  });

  it('rejects a non-NGN currency even when the number matches', async () => {
    const out = await settleCharge(deps, { ...success, currency: 'USD' }, 'verify');
    expect(out).toEqual({ kind: 'currency_mismatch', currency: 'USD' });
    expect(deps.applyPaidOrder).not.toHaveBeenCalled();
    expect(deps.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'payment.currency_mismatch' }));
  });

  it('ignores references we never issued', async () => {
    const out = await settleCharge(deps, { ...success, reference: 'SOMEBODY-ELSE' }, 'webhook');
    expect(out).toEqual({ kind: 'unknown_reference' });
    expect(deps.applyPaidOrder).not.toHaveBeenCalled();
  });

  it('records failed/abandoned attempts without touching the order', async () => {
    const out = await settleCharge(deps, { ...success, status: 'failed' }, 'verify');
    expect(out).toEqual({ kind: 'not_successful', status: 'failed' });
    expect(deps.markPaymentStatus).toHaveBeenCalledWith(payment.reference, 'failed', expect.anything());
    expect(deps.applyPaidOrder).not.toHaveBeenCalled();
  });

  it('still reports paid when the email provider fails (email is best-effort after the claim)', async () => {
    deps = makeDeps({ sendOrderConfirmationEmail: vi.fn(async () => false) });
    const out = await settleCharge(deps, success, 'webhook');
    expect(out).toMatchObject({ kind: 'paid', emailSent: false });
  });
});

describe('verifyPaystackSignature', () => {
  const secret = 'sk_test_unit_secret_1234567890';
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'X' } });

  it('accepts a valid HMAC-SHA512 signature', () => {
    const sig = crypto.createHmac('sha512', secret).update(body).digest('hex');
    expect(verifyPaystackSignature(body, sig, secret)).toBe(true);
  });

  it('rejects tampered bodies, wrong secrets and missing signatures', () => {
    const sig = crypto.createHmac('sha512', secret).update(body).digest('hex');
    expect(verifyPaystackSignature(body + ' ', sig, secret)).toBe(false);
    expect(verifyPaystackSignature(body, sig, 'sk_test_other_secret_000000000')).toBe(false);
    expect(verifyPaystackSignature(body, null, secret)).toBe(false);
    expect(verifyPaystackSignature(body, 'deadbeef', secret)).toBe(false);
  });
});
