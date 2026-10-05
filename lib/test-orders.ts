import { isPaystackConfigured } from './paystack';

/**
 * Test checkout (order confirmed, no payment taken) for signed-in shoppers. On when:
 *   - Paystack keys are not configured (payments would be impossible anyway), or
 *   - TEST_ORDER_EMAILS is "*" (everyone) or lists the shopper's email.
 * Adding Paystack keys and removing TEST_ORDER_EMAILS turns it off.
 * Server-only: never expose this with a NEXT_PUBLIC_ prefix.
 */
export const TEST_PAYMENT_CHANNEL = 'test';

export function isTestCheckout(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!isPaystackConfigured()) return true;
  const allowed = (process.env.TEST_ORDER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes('*') || allowed.includes(email.trim().toLowerCase());
}
