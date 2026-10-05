import {
  addAuditLog,
  applyPaidOrder,
  claimOrderConfirmation,
  getOrderById,
  getPaymentByReference,
  getStoreSettings,
  markPaymentStatus,
  removePurchasedFromUserCart,
} from './db';
import { sendOrderConfirmationEmail } from './email';
import { settleCharge, type ChargeData, type SettleDeps, type SettleOutcome } from './payments';
import { verifyPaystackTransaction } from './paystack';
import { TEST_PAYMENT_CHANNEL } from './test-orders';

export const liveSettleDeps: SettleDeps = {
  getPaymentByReference,
  applyPaidOrder,
  markPaymentStatus,
  claimOrderConfirmation,
  getOrderById,
  getStoreSettings,
  sendOrderConfirmationEmail,
  addAuditLog: (entry) => addAuditLog(entry),
};

/**
 * Runs once per order (only the settlement that flips it to paid gets `kind: 'paid'`),
 * so the bag empties on every device even if the confirmation page never loads.
 */
async function removePurchasedItemsFromSavedCart(outcome: SettleOutcome): Promise<void> {
  if (outcome.kind !== 'paid') return;
  try {
    const order = await getOrderById(outcome.orderId);
    if (!order?.user_id) return;
    const purchased = order.items
      .filter((i) => i.variant_id)
      .map((i) => ({ variant_id: i.variant_id as string, fit_type: i.fit_type, qty: i.qty }));
    await removePurchasedFromUserCart(order.user_id, purchased);
  } catch (err) {
    console.error('[payments] clearing saved cart failed:', err);
  }
}

/** Webhook path: payload already signature-verified by the caller. */
export async function settleFromWebhook(data: ChargeData): Promise<SettleOutcome> {
  const outcome = await settleCharge(liveSettleDeps, data, 'webhook');
  await removePurchasedItemsFromSavedCart(outcome);
  return outcome;
}

/**
 * Test checkout: settles the order through the normal paid path (stock, saved cart,
 * confirmation email, audit) without Paystack. Callers MUST check isTestCheckout() first.
 */
export async function settleTestOrder(reference: string, amountKobo: number): Promise<SettleOutcome> {
  const outcome = await settleCharge(
    liveSettleDeps,
    { reference, amount: amountKobo, currency: 'NGN', status: 'success', channel: TEST_PAYMENT_CHANNEL },
    'test'
  );
  await removePurchasedItemsFromSavedCart(outcome);
  return outcome;
}

/** Verify path: ask Paystack for the truth, then settle. */
export async function verifyAndSettle(reference: string): Promise<SettleOutcome> {
  const tx = await verifyPaystackTransaction(reference);
  const outcome = await settleCharge(liveSettleDeps, tx, 'verify');
  await removePurchasedItemsFromSavedCart(outcome);
  return outcome;
}
