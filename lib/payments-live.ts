import {
  addAuditLog,
  applyPaidOrder,
  claimOrderConfirmation,
  getOrderById,
  getPaymentByReference,
  getStoreSettings,
  markPaymentStatus,
} from './db';
import { sendOrderConfirmationEmail } from './email';
import { settleCharge, type ChargeData, type SettleDeps, type SettleOutcome } from './payments';
import { verifyPaystackTransaction } from './paystack';

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

/** Webhook path: payload already signature-verified by the caller. */
export function settleFromWebhook(data: ChargeData): Promise<SettleOutcome> {
  return settleCharge(liveSettleDeps, data, 'webhook');
}

/** Verify path: ask Paystack for the truth, then settle. */
export async function verifyAndSettle(reference: string): Promise<SettleOutcome> {
  const tx = await verifyPaystackTransaction(reference);
  return settleCharge(liveSettleDeps, tx, 'verify');
}
