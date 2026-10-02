import { describe, it, expect } from 'vitest';
import {
  formatNaira,
  formatMoney,
  nairaToKobo,
  koboToNaira,
  calculateLineTotal,
  calculateTotal,
  generateOrderNumber,
  generateQuoteReference,
  generateBookingReference,
} from '../lib/money';

describe('Money Math & Integer Kobo Calculations', () => {
  it('formats integer kobo into standard Nigerian Naira currency format', () => {
    expect(formatNaira(18500000)).toBe('₦185,000');
    expect(formatNaira(15000000)).toBe('₦150,000');
    expect(formatNaira(350000)).toBe('₦3,500');
    expect(formatNaira(0)).toBe('₦0');
  });

  it('provides indicative display conversions for USD and GBP using store FX rates', () => {
    const customFx = { USD: 1550, GBP: 1980 };
    // ₦155,000 = 15,500,000 kobo -> $100.00
    expect(formatMoney(15500000, 'USD', customFx)).toContain('$100.00');
    // ₦198,000 = 19,800,000 kobo -> £100.00
    expect(formatMoney(19800000, 'GBP', customFx)).toContain('£100.00');
    // NGN defaults to formatNaira
    expect(formatMoney(15500000, 'NGN', customFx)).toBe('₦155,000');
  });

  it('accurately converts Naira to integer kobo and vice versa without floating drift', () => {
    expect(nairaToKobo(185000)).toBe(18500000);
    expect(koboToNaira(18500000)).toBe(185000);
    expect(nairaToKobo(4500.5)).toBe(450050);
  });

  it('calculates line total in integer kobo', () => {
    // ₦35,000 × 3 = ₦105,000
    expect(calculateLineTotal(3500000, 3)).toBe(10500000);
    expect(calculateLineTotal(18500000, 1)).toBe(18500000);
  });

  it('calculates order total as subtotal + delivery fee in integer kobo', () => {
    const subtotal = 18500000; // ₦185,000
    const delivery = 450000;   // ₦4,500
    expect(calculateTotal(subtotal, delivery)).toBe(18950000); // ₦189,500
  });

  it('generates compliant references matching design specs', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^APF-\d{6}-\d{4}$/);

    const quoteRef = generateQuoteReference();
    expect(quoteRef).toMatch(/^QT-\d{6}-\d{4}$/);

    const bookingRef = generateBookingReference();
    expect(bookingRef).toMatch(/^BK-\d{6}-\d{4}$/);
  });
});
