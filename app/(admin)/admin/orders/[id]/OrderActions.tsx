'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { cancelOrderAction, updateOrderStatusAction } from '@/app/(admin)/admin/actions';

const NEXT_STATUSES: Record<OrderStatus, Array<{ value: OrderStatus; label: string }>> = {
  pending: [],
  paid: [{ value: 'processing', label: 'Start tailoring (processing)' }],
  processing: [{ value: 'shipped', label: 'Mark shipped' }],
  shipped: [{ value: 'delivered', label: 'Mark delivered' }],
  delivered: [],
  cancelled: [],
};

export function OrderActions({ order }: { order: Order }) {
  const [showCancel, setShowCancel] = useState(false);
  const nextOptions = NEXT_STATUSES[order.status];
  const canCancel = order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <section className="bg-white rounded-lg border border-stone p-4 space-y-4 text-xs">
      <h2 className="font-serif text-base font-semibold text-navy">Update order</h2>

      {order.status === 'pending' && (
        <p className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
          Awaiting payment. The order becomes <strong>Paid</strong> automatically once Paystack confirms; it cannot be advanced manually.
        </p>
      )}

      {nextOptions.length > 0 && (
        <ActionForm action={updateOrderStatusAction} className="space-y-3">
          <input type="hidden" name="order_id" value={order.id} />
          <div>
            <label htmlFor="status" className="block font-medium text-navy mb-1">Next step</label>
            <select id="status" name="status" defaultValue={nextOptions[0].value} className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]">
              {nextOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tracking_url" className="block font-medium text-navy mb-1">Tracking link {order.status === 'processing' ? '(required for shipped)' : '(optional)'}</label>
            <input id="tracking_url" name="tracking_url" type="url" defaultValue={order.tracking_url ?? ''} placeholder="https://courier.example/track/…" className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" />
          </div>
          <div>
            <label htmlFor="internal_note" className="block font-medium text-navy mb-1">Internal note (not shown to customer)</label>
            <textarea id="internal_note" name="internal_note" rows={2} defaultValue={order.internal_note ?? ''} className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded" />
          </div>
          <SubmitButton pendingLabel="Saving…" className="w-full py-2.5 bg-navy hover:bg-navy-2 text-ivory font-semibold rounded">
            Save update
          </SubmitButton>
        </ActionForm>
      )}

      {order.status === 'delivered' && <p className="text-text-3">This order is complete.</p>}
      {order.status === 'cancelled' && (
        <p className="text-text-3">
          Cancelled {order.cancelled_at ? new Date(order.cancelled_at).toLocaleString('en-NG') : ''}. {order.cancel_reason && <>Reason: {order.cancel_reason}</>}
        </p>
      )}

      {canCancel && (
        <div className="pt-3 border-t border-stone">
          {!showCancel ? (
            <button type="button" onClick={() => setShowCancel(true)} className="text-aplus-error font-semibold hover:underline">
              Cancel this order…
            </button>
          ) : (
            <ActionForm action={cancelOrderAction} className="space-y-2" confirmMessage={`Cancel order ${order.order_number}? This cannot be undone.`}>
              <input type="hidden" name="order_id" value={order.id} />
              <div className="flex items-start space-x-2 p-2.5 bg-red-50 border border-red-200 rounded text-aplus-error">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p>{order.payment?.status === 'success' ? 'This order is paid. After cancelling, issue the refund from Payments.' : 'No successful payment on this order.'}</p>
              </div>
              <label htmlFor="reason" className="block font-medium text-navy">Reason (shown to customer)</label>
              <input id="reason" name="reason" required minLength={3} className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded min-h-[40px]" placeholder="e.g. Fabric unavailable; customer requested" />
              <div className="flex gap-2">
                <SubmitButton pendingLabel="Cancelling…" className="flex-1 py-2 bg-aplus-error hover:bg-red-700 text-white font-semibold rounded">
                  Confirm cancellation
                </SubmitButton>
                <button type="button" onClick={() => setShowCancel(false)} className="px-3 py-2 border border-stone rounded text-text-2">
                  Keep
                </button>
              </div>
            </ActionForm>
          )}
        </div>
      )}
    </section>
  );
}
