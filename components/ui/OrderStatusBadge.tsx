import React from 'react';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

const ORDER_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting payment', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-aplus-success border-emerald-200' },
  processing: { label: 'In tailoring', className: 'bg-navy text-gold-light border-navy' },
  shipped: { label: 'Shipped', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-aplus-error border-red-200' },
};

const PAYMENT_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  initialized: { label: 'Initialized', className: 'bg-ivory-2 text-text-2 border-stone' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  success: { label: 'Success', className: 'bg-emerald-50 text-aplus-success border-emerald-200' },
  failed: { label: 'Failed', className: 'bg-red-50 text-aplus-error border-red-200' },
  abandoned: { label: 'Abandoned', className: 'bg-ivory-2 text-text-3 border-stone' },
};

export function OrderStatusBadge({ status, className = '' }: { status: OrderStatus; className?: string }) {
  const s = ORDER_STYLES[status] ?? ORDER_STYLES.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide border ${s.className} ${className}`}>
      {s.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = '' }: { status: PaymentStatus; className?: string }) {
  const s = PAYMENT_STYLES[status] ?? PAYMENT_STYLES.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${s.className} ${className}`}>
      {s.label}
    </span>
  );
}
