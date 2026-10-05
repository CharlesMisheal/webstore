import { afterEach, describe, expect, it } from 'vitest';
import { isTestCheckout } from '../lib/test-orders';

const original = { key: process.env.PAYSTACK_SECRET_KEY, list: process.env.TEST_ORDER_EMAILS };
const REAL_LOOKING_KEY = 'sk_test_abcdefghijklmnop123456';

afterEach(() => {
  process.env.PAYSTACK_SECRET_KEY = original.key;
  process.env.TEST_ORDER_EMAILS = original.list;
});

describe('isTestCheckout', () => {
  it('is never on without a signed-in email', () => {
    process.env.PAYSTACK_SECRET_KEY = '';
    expect(isTestCheckout('')).toBe(false);
    expect(isTestCheckout(null)).toBe(false);
  });

  it('switches on automatically while Paystack is not configured', () => {
    process.env.PAYSTACK_SECRET_KEY = '';
    process.env.TEST_ORDER_EMAILS = '';
    expect(isTestCheckout('shopper@example.com')).toBe(true);
  });

  it('is off once Paystack is configured and no override is set', () => {
    process.env.PAYSTACK_SECRET_KEY = REAL_LOOKING_KEY;
    process.env.TEST_ORDER_EMAILS = '';
    expect(isTestCheckout('shopper@example.com')).toBe(false);
  });

  it('"*" allows everyone; a list allows only those emails (case-insensitive)', () => {
    process.env.PAYSTACK_SECRET_KEY = REAL_LOOKING_KEY;
    process.env.TEST_ORDER_EMAILS = '*';
    expect(isTestCheckout('anyone@example.com')).toBe(true);
    process.env.TEST_ORDER_EMAILS = 'Owner@Example.com, tester@example.com';
    expect(isTestCheckout('owner@example.com')).toBe(true);
    expect(isTestCheckout('someone-else@example.com')).toBe(false);
  });
});
