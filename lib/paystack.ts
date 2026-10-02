import crypto from 'crypto';

/**
 * Thin Paystack REST client. Server only (uses the secret key).
 * No demo/mock mode: if the key is missing the caller gets a clear error and
 * the storefront offers the WhatsApp fallback instead of pretending to charge.
 */

const PAYSTACK_API = 'https://api.paystack.co';

export class PaystackError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
    this.name = 'PaystackError';
  }
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !/^sk_(test|live)_[A-Za-z0-9]{10,}$/.test(key) || key.includes('xxxx') || key.endsWith('_sample')) {
    throw new PaystackError('Paystack is not configured. Set PAYSTACK_SECRET_KEY to your sk_test_/sk_live_ key.', 503);
  }
  return key;
}

export function isPaystackConfigured(): boolean {
  try {
    secretKey();
    return true;
  } catch {
    return false;
  }
}

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackTransactionData {
  id: number;
  reference: string;
  amount: number; // kobo
  currency: string;
  status: 'success' | 'failed' | 'abandoned' | 'pending' | 'reversed' | 'ongoing' | 'processing' | 'queued';
  channel?: string;
  paid_at?: string | null;
  gateway_response?: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown> | string | null;
  fees?: number | null;
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data?: T;
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!res.ok || !json || !json.status || json.data === undefined) {
    throw new PaystackError(json?.message || `Paystack request failed (${res.status})`, res.status >= 500 ? 502 : 400);
  }
  return json.data;
}

/**
 * Validates the Paystack webhook signature: HMAC SHA-512 of the raw body with
 * the secret key, compared with timingSafeEqual (developer-note.md §5).
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null | undefined, secret?: string): boolean {
  if (!signature || !rawBody) return false;
  try {
    const key = secret ?? secretKey();
    const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitData> {
  return paystackFetch<PaystackInitData>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: Math.floor(params.amountKobo),
      currency: 'NGN',
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      metadata: params.metadata,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackTransactionData> {
  return paystackFetch<PaystackTransactionData>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
}

export interface PaystackRefundData {
  id: number;
  transaction: { id: number; reference: string } | number;
  amount: number;
  currency: string;
  status: string;
}

/** Full or partial refund. Amount in kobo; omit for a full refund. */
export async function createPaystackRefund(params: { reference: string; amountKobo?: number; reason?: string }): Promise<PaystackRefundData> {
  return paystackFetch<PaystackRefundData>('/refund', {
    method: 'POST',
    body: JSON.stringify({
      transaction: params.reference,
      amount: params.amountKobo !== undefined ? Math.floor(params.amountKobo) : undefined,
      currency: 'NGN',
      merchant_note: params.reason,
    }),
  });
}
