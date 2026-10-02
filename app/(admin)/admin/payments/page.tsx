import React from 'react';
import { CreditCard, Search } from 'lucide-react';
import { getPayments, getRefunds } from '@/lib/db';
import { isPaystackConfigured } from '@/lib/paystack';
import { formatNaira } from '@/lib/money';
import { AdminPageHeader, EmptyState } from '@/components/admin/AdminPageHeader';
import { PaymentsTable } from './PaymentsTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payments' };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const [payments, refunds] = await Promise.all([getPayments(300), getRefunds()]);
  const q = searchParams.q?.trim().toLowerCase() ?? '';
  const status = searchParams.status ?? 'all';

  const filtered = payments.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (!q) return true;
    return [p.reference, p.order_number, p.customer_name, p.customer_email].some((v) => v?.toLowerCase().includes(q));
  });

  const refundsByPayment = new Map<string, typeof refunds>();
  for (const r of refunds) {
    const list = refundsByPayment.get(r.payment_id) ?? [];
    list.push(r);
    refundsByPayment.set(r.payment_id, list);
  }

  const successful = payments.filter((p) => p.status === 'success');
  const grossKobo = successful.reduce((s, p) => s + p.amount_kobo, 0);
  const refundedKobo = refunds.filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount_kobo, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Money"
        title="Payments & refunds"
        description="Every Paystack attempt. Amounts are what Paystack confirmed, not what the customer's browser said."
      />

      {!isPaystackConfigured() && (
        <p role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
          Paystack secret key is not configured on the server — refunds are disabled until <code>PAYSTACK_SECRET_KEY</code> is set.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Collected (gross)', value: formatNaira(grossKobo), sub: `${successful.length} successful payment(s)` },
          { label: 'Refunded', value: formatNaira(refundedKobo), sub: `${refunds.length} refund(s)` },
          { label: 'Net', value: formatNaira(grossKobo - refundedKobo), sub: 'Collected minus refunds' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-lg border border-stone">
            <p className="text-[11px] uppercase tracking-wider text-text-3 font-semibold">{s.label}</p>
            <p className="font-serif text-2xl font-bold text-navy mt-1">{s.value}</p>
            <p className="text-[11px] text-text-3">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg border border-stone flex flex-col sm:flex-row gap-3 sm:items-center">
        <form className="relative flex-1" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="pay-search" className="sr-only">Search payments</label>
          <input id="pay-search" name="q" defaultValue={searchParams.q ?? ''} placeholder="Reference, order number, customer…" className="w-full pl-8 pr-3 py-2 bg-ivory-2 border border-stone rounded text-xs" />
          <Search className="w-3.5 h-3.5 text-text-3 absolute left-2.5 top-2.5" aria-hidden="true" />
        </form>
        <form className="flex items-center gap-2 text-xs">
          <input type="hidden" name="q" value={searchParams.q ?? ''} />
          <label htmlFor="pay-status" className="text-text-3">Status</label>
          <select id="pay-status" name="status" defaultValue={status} className="px-2 py-2 bg-ivory-2 border border-stone rounded">
            {['all', 'success', 'initialized', 'pending', 'failed', 'abandoned'].map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-2 bg-navy text-ivory rounded font-medium">Filter</button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments" body="Paystack attempts appear here as soon as a customer starts checkout." />
        ) : (
          <PaymentsTable
            payments={filtered}
            refunds={Object.fromEntries(Array.from(refundsByPayment.entries()))}
            refundsEnabled={isPaystackConfigured()}
          />
        )}
      </div>
    </div>
  );
}
