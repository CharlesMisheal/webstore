/**
 * Payment settlement logic shared by the Paystack webhook and /api/pay/verify.
 *
 * Both entry points funnel into `settleCharge`, which:
 *   1. Looks up our payment attempt by reference (unknown reference -> ignored).
 *   2. Rejects currency != NGN and amount < order total (logged + audited; the
 *      order stays pending so the owner can see it in /admin/payments).
 *   3. Calls the atomic `apply_paid_order` claim. Only the caller that wins the
 *      claim marks the order paid, decrements stock and sends the confirmation
 *      email (guarded a second time by `claim_order_confirmation`).
 *
 * Dependencies are injected so the whole flow is unit-testable without Supabase.
 */

import type { Order, Payment, StoreSettings } from './types';
import type { PaystackTransactionData } from './paystack';

export interface SettleDeps {
  getPaymentByReference: (reference: string) => Promise<(Payment & { order: Order | null }) | null>;
  applyPaidOrder: (reference: string, channel: string, amountKobo: number, raw: unknown) => Promise<string | null>;
  markPaymentStatus: (reference: string, status: Payment['status'], raw?: unknown) => Promise<void>;
  claimOrderConfirmation: (orderId: string) => Promise<boolean>;
  getOrderById: (id: string) => Promise<Order | null>;
  getStoreSettings: () => Promise<StoreSettings>;
  sendOrderConfirmationEmail: (order: Order, settings: StoreSettings) => Promise<boolean>;
  addAuditLog: (entry: {
    actor_email: string;
    action: string;
    entity: string;
    entity_id?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  }) => Promise<void>;
}

export type SettleOutcome =
  | { kind: 'paid'; orderId: string; emailSent: boolean }
  | { kind: 'already_paid'; orderId: string }
  | { kind: 'unknown_reference' }
  | { kind: 'amount_mismatch'; expected: number; received: number }
  | { kind: 'currency_mismatch'; currency: string }
  | { kind: 'not_successful'; status: string };

/** Minimal shape we need from either the webhook payload or the verify response. */
export type ChargeData = Pick<PaystackTransactionData, 'reference' | 'amount' | 'currency' | 'status' | 'channel'> &
  Partial<Omit<PaystackTransactionData, 'reference' | 'amount' | 'currency' | 'status' | 'channel'>>;

export async function settleCharge(deps: SettleDeps, data: ChargeData, source: 'webhook' | 'verify'): Promise<SettleOutcome> {
  const reference = String(data.reference || '');
  if (!reference) return { kind: 'unknown_reference' };

  const payment = await deps.getPaymentByReference(reference);
  if (!payment || !payment.order) return { kind: 'unknown_reference' };

  if (data.status !== 'success') {
    const mapped: Payment['status'] = data.status === 'abandoned' ? 'abandoned' : data.status === 'failed' ? 'failed' : 'pending';
    await deps.markPaymentStatus(reference, mapped, data);
    return { kind: 'not_successful', status: String(data.status) };
  }

  const currency = String(data.currency || '').toUpperCase();
  if (currency !== 'NGN') {
    await deps.addAuditLog({
      actor_email: `paystack:${source}`,
      action: 'payment.currency_mismatch',
      entity: 'payments',
      entity_id: reference,
      after: { currency, order_id: payment.order_id },
    });
    return { kind: 'currency_mismatch', currency };
  }

  const received = Math.floor(Number(data.amount));
  const expected = payment.order.total_kobo;
  if (!Number.isFinite(received) || received < expected) {
    await deps.addAuditLog({
      actor_email: `paystack:${source}`,
      action: 'payment.amount_mismatch',
      entity: 'payments',
      entity_id: reference,
      after: { expected_kobo: expected, received_kobo: received, order_id: payment.order_id },
    });
    return { kind: 'amount_mismatch', expected, received };
  }

  const claimedOrderId = await deps.applyPaidOrder(reference, data.channel || 'unknown', received, data);
  if (!claimedOrderId) {
    return { kind: 'already_paid', orderId: payment.order_id };
  }

  let emailSent = false;
  if (await deps.claimOrderConfirmation(claimedOrderId)) {
    try {
      const [order, settings] = await Promise.all([deps.getOrderById(claimedOrderId), deps.getStoreSettings()]);
      if (order) emailSent = await deps.sendOrderConfirmationEmail(order, settings);
    } catch (err) {
      console.error('[payments] confirmation email failed:', err);
    }
  }

  await deps.addAuditLog({
    actor_email: `paystack:${source}`,
    action: 'order.paid',
    entity: 'orders',
    entity_id: claimedOrderId,
    after: { reference, amount_kobo: received, channel: data.channel, email_sent: emailSent },
  });

  return { kind: 'paid', orderId: claimedOrderId, emailSent };
}
