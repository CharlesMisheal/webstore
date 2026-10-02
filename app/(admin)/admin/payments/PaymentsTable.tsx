'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, RotateCcw } from 'lucide-react';
import type { Payment, Refund } from '@/lib/types';
import { formatNaira } from '@/lib/money';
import { PaymentStatusBadge } from '@/components/ui/OrderStatusBadge';
import { formatDateTime } from '@/components/admin/AdminPageHeader';

type PaymentRow = Payment & { order_number?: string; customer_name?: string; customer_email?: string };

interface Props {
  payments: PaymentRow[];
  refunds: Record<string, Refund[]>;
  refundsEnabled: boolean;
}

export function PaymentsTable({ payments, refunds, refundsEnabled }: Props) {
  const [target, setTarget] = useState<PaymentRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
              <th className="p-3">Reference</th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Status</th>
              <th className="p-3">Refund</th>
              <th className="p-3">When</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {payments.map((p) => {
              const list = refunds[p.reference] ?? [];
              const refundedKobo = list.filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount_kobo, 0);
              const canRefund = refundsEnabled && p.status === 'success' && p.refund_status !== 'full' && refundedKobo < p.amount_kobo;
              return (
                <tr key={p.reference} className="hover:bg-ivory-2/50">
                  <td className="p-3 font-mono text-[11px]">{p.reference}</td>
                  <td className="p-3 font-semibold text-navy">
                    {p.order_number ? <Link href={`/admin/orders/${p.order_id}`} className="hover:underline">{p.order_number}</Link> : '—'}
                  </td>
                  <td className="p-3">
                    <p className="text-navy">{p.customer_name ?? '—'}</p>
                    <p className="text-[11px] text-text-3">{p.customer_email}</p>
                  </td>
                  <td className="p-3 text-right font-semibold text-navy">{formatNaira(p.amount_kobo)}</td>
                  <td className="p-3">{p.channel || '—'}</td>
                  <td className="p-3"><PaymentStatusBadge status={p.status} /></td>
                  <td className="p-3">
                    {p.refund_status === 'none' ? (
                      <span className="text-text-3">—</span>
                    ) : (
                      <span className="uppercase text-[10px] font-semibold text-aplus-error">
                        {p.refund_status}
                        {refundedKobo > 0 && <span className="block normal-case text-text-3 font-normal">{formatNaira(refundedKobo)}</span>}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-text-3 whitespace-nowrap">{formatDateTime(p.paid_at || p.created_at)}</td>
                  <td className="p-3 text-right">
                    {canRefund && (
                      <button type="button" onClick={() => setTarget(p)} className="px-2.5 py-1 bg-ivory-2 hover:bg-stone text-navy rounded border border-stone font-medium text-[11px] inline-flex items-center space-x-1">
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        <span>Refund</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {target && <RefundDialog payment={target} alreadyRefundedKobo={(refunds[target.reference] ?? []).filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount_kobo, 0)} onClose={() => setTarget(null)} />}
    </>
  );
}

function RefundDialog({ payment, alreadyRefundedKobo, onClose }: { payment: PaymentRow; alreadyRefundedKobo: number; onClose: () => void }) {
  const router = useRouter();
  const maxKobo = payment.amount_kobo - alreadyRefundedKobo;
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [amountNaira, setAmountNaira] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amountKobo = mode === 'partial' ? Math.round(Number(amountNaira) * 100) : undefined;
    if (mode === 'partial' && (!amountKobo || amountKobo <= 0 || amountKobo > maxKobo)) {
      setError(`Enter an amount between ₦1 and ${formatNaira(maxKobo)}.`);
      return;
    }
    if (!window.confirm(`Refund ${mode === 'full' ? formatNaira(maxKobo) : formatNaira(amountKobo!)} to ${payment.customer_name ?? 'the customer'}? Paystack processes this within 5–10 business days.`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: payment.reference, amount_kobo: mode === 'partial' ? amountKobo : undefined, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 440 || res.status === 401) {
          router.push('/admin/login?timeout=idle');
          return;
        }
        setError(data.message || 'Refund failed');
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="refund-title">
      <form onSubmit={submit} className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="refund-title" className="font-serif text-lg font-bold text-navy">Refund payment</h2>
            <p className="text-text-3 font-mono mt-0.5">{payment.reference}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:bg-ivory-2 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-3 bg-ivory-2 rounded border border-stone space-y-1">
          <p><span className="text-text-3">Order:</span> <strong className="text-navy">{payment.order_number}</strong></p>
          <p><span className="text-text-3">Paid:</span> {formatNaira(payment.amount_kobo)}{alreadyRefundedKobo > 0 && <> · already refunded {formatNaira(alreadyRefundedKobo)}</>}</p>
          <p><span className="text-text-3">Refundable:</span> <strong className="text-navy">{formatNaira(maxKobo)}</strong></p>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-medium text-navy">Refund type</legend>
          <label className="flex items-center space-x-2"><input type="radio" name="mode" checked={mode === 'full'} onChange={() => setMode('full')} /><span>Full refund ({formatNaira(maxKobo)})</span></label>
          <label className="flex items-center space-x-2"><input type="radio" name="mode" checked={mode === 'partial'} onChange={() => setMode('partial')} /><span>Partial refund</span></label>
          {mode === 'partial' && (
            <div className="pl-6">
              <label htmlFor="refund-amount" className="block text-text-3 mb-1">Amount (₦)</label>
              <input id="refund-amount" type="number" min={1} max={maxKobo / 100} step="0.01" value={amountNaira} onChange={(e) => setAmountNaira(e.target.value)} required className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" />
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor="refund-reason" className="block font-medium text-navy mb-1">Reason (recorded in the audit log)</label>
          <input id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={300} className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" placeholder="e.g. Order cancelled — fabric unavailable" />
        </div>

        {error && <p role="alert" className="p-2.5 bg-red-50 border border-red-200 text-aplus-error rounded">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={busy} className="flex-1 py-2.5 bg-aplus-error hover:bg-red-700 text-white font-semibold rounded disabled:opacity-60">
            {busy ? 'Submitting to Paystack…' : 'Issue refund'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-stone rounded text-text-2">Cancel</button>
        </div>
      </form>
    </div>
  );
}
