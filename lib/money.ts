/**
 * Money utilities for A-Plus Fashion Home.
 * Hard rule: Money is strictly integer kobo (1 NGN = 100 kobo).
 * Never use floating point calculations for financial totals.
 */

export const DEFAULT_FX_RATES = {
  USD: 1550, // 1 USD = 1,550 NGN
  GBP: 1980, // 1 GBP = 1,980 NGN
};

/**
 * Formats integer kobo as Nigerian Naira string (e.g. 15000000 kobo -> ₦150,000).
 */
export function formatNaira(kobo: number): string {
  const safeKobo = Math.max(0, Math.round(Number(kobo) || 0));
  const naira = Math.floor(safeKobo / 100);
  return `₦${naira.toLocaleString('en-NG')}`;
}

/**
 * Formats integer kobo according to chosen currency.
 * Note: USD and GBP are display-only estimates; transaction currency is always NGN.
 */
export function formatMoney(
  kobo: number,
  currency: 'NGN' | 'USD' | 'GBP' = 'NGN',
  fxRates: { USD: number; GBP: number } = DEFAULT_FX_RATES
): string {
  const safeKobo = Math.max(0, Math.round(Number(kobo) || 0));
  const naira = safeKobo / 100;

  if (currency === 'USD') {
    const rate = fxRates.USD || DEFAULT_FX_RATES.USD;
    const usd = (naira / rate).toFixed(2);
    return `≈ $${Number(usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (currency === 'GBP') {
    const rate = fxRates.GBP || DEFAULT_FX_RATES.GBP;
    const gbp = (naira / rate).toFixed(2);
    return `≈ £${Number(gbp).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return formatNaira(safeKobo);
}

/**
 * Safely converts Naira amount to integer kobo.
 */
export function nairaToKobo(naira: number): number {
  return Math.max(0, Math.round(Number(naira || 0) * 100));
}

/**
 * Safely converts integer kobo to whole Naira.
 */
export function koboToNaira(kobo: number): number {
  return Math.max(0, Math.floor(Number(kobo || 0) / 100));
}

/**
 * Calculates item subtotal in integer kobo.
 */
export function calculateLineTotal(unitPriceKobo: number, qty: number): number {
  const price = Math.max(0, Math.floor(Number(unitPriceKobo) || 0));
  const quantity = Math.max(1, Math.floor(Number(qty) || 1));
  return price * quantity;
}

/**
 * Calculates cart or order total in integer kobo.
 */
export function calculateTotal(subtotalKobo: number, deliveryFeeKobo: number): number {
  const subtotal = Math.max(0, Math.floor(Number(subtotalKobo) || 0));
  const delivery = Math.max(0, Math.floor(Number(deliveryFeeKobo) || 0));
  return subtotal + delivery;
}

/**
 * Generates an official A-Plus order number format (APF-YYMMDD-XXXX).
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APF-${yy}${mm}${dd}-${rand}`;
}

/**
 * Generates an official quote reference format (QT-YYMMDD-XXXX).
 */
export function generateQuoteReference(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `QT-${yy}${mm}${dd}-${rand}`;
}

/**
 * Generates an official booking reference format (BK-YYMMDD-XXXX).
 */
export function generateBookingReference(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BK-${yy}${mm}${dd}-${rand}`;
}
