import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyPaystackSignature } from '../lib/paystack';

describe('Paystack Webhook HMAC SHA-512 Signature Verification', () => {
  const secretKey = 'sk_test_testsecretkey1234567890';
  const samplePayload = JSON.stringify({
    event: 'charge.success',
    data: {
      id: 302949,
      reference: 'APF-261001-8392-xyz',
      amount: 18950000,
      currency: 'NGN',
      status: 'success',
      channel: 'card',
    },
  });

  it('validates a genuine HMAC SHA-512 signature', () => {
    const validSignature = crypto.createHmac('sha512', secretKey).update(samplePayload).digest('hex');
    const isValid = verifyPaystackSignature(samplePayload, validSignature, secretKey);
    expect(isValid).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const validSignature = crypto.createHmac('sha512', secretKey).update(samplePayload).digest('hex');
    const tamperedPayload = JSON.stringify({
      event: 'charge.success',
      data: {
        id: 302949,
        reference: 'APF-261001-8392-xyz',
        amount: 1000, // attacker tried to pay 10 NGN instead of 189,500 NGN
        currency: 'NGN',
        status: 'success',
      },
    });

    const isValid = verifyPaystackSignature(tamperedPayload, validSignature, secretKey);
    expect(isValid).toBe(false);
  });

  it('rejects an invalid signature with different length or value', () => {
    expect(verifyPaystackSignature(samplePayload, 'invalid_signature_string', secretKey)).toBe(false);
    expect(verifyPaystackSignature(samplePayload, '', secretKey)).toBe(false);
  });

  it('rejects when secret key does not match', () => {
    const validSignature = crypto.createHmac('sha512', secretKey).update(samplePayload).digest('hex');
    const wrongSecret = 'sk_test_wrongsecretkey';
    const isValid = verifyPaystackSignature(samplePayload, validSignature, wrongSecret);
    expect(isValid).toBe(false);
  });
});
