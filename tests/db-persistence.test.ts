import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aplus-store-'));
const storeFile = path.join(tempDir, 'store.json');
process.env.APLUS_STORE_FILE = storeFile;

const dbModule = await import('../lib/db');

afterEach(() => {
  if (fs.existsSync(storeFile)) {
    fs.rmSync(storeFile, { force: true });
  }
  fs.writeFileSync(storeFile, JSON.stringify({ categories: [], products: [], orders: [], quotes: [], bookings: [], reviews: [], settings: {}, auditLogs: [] }, null, 2));
});

describe('DB persistence', () => {
  it('writes quote submissions to disk so they survive restarts', async () => {
    const quote = await dbModule.createQuote({
      reference: 'QT-TEST-0001',
      customer_name: 'Test Buyer',
      customer_email: 'test@example.com',
      customer_phone: '+2348000000000',
      garment: 'Bespoke Suit',
      occasion: 'Wedding',
      event_date: '2026-12-15',
      budget_min_kobo: 15000000,
      budget_max_kobo: 25000000,
      notes: 'Need a modern fit',
      photo_paths: [],
      contact_preference: 'WhatsApp',
      status: 'requested',
    });

    expect(quote.reference).toBe('QT-TEST-0001');

    const stored = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    expect(stored.quotes.some((item: { reference: string }) => item.reference === quote.reference)).toBe(true);
  });
});
