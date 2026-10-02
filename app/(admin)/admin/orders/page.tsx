import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Search } from 'lucide-react';
import { getOrders } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import type { OrderStatus } from '@/lib/types';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/OrderStatusBadge';
import { AdminPageHeader, EmptyState, formatDateTime } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders' };

const STATUS_TABS: Array<{ id: OrderStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Awaiting payment' },
  { id: 'paid', label: 'Paid' },
  { id: 'processing', label: 'In tailoring' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

interface Props {
  searchParams: { status?: string; q?: string };
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const status = (STATUS_TABS.find((t) => t.id === searchParams.status)?.id ?? 'all') as OrderStatus | 'all';
  const q = searchParams.q?.trim() ?? '';
  const orders = await getOrders({ status, search: q || undefined, limit: 300 });

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Fulfilment" title="Orders" description="Every order is created at checkout; payment status comes only from Paystack verification." />

      <div className="bg-white p-4 rounded-lg border border-stone space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin/orders?status=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              aria-current={status === t.id ? 'page' : undefined}
              className={`px-3 py-1.5 rounded font-medium transition ${status === t.id ? 'bg-navy text-ivory' : 'bg-ivory-2 text-text-2 hover:bg-stone'}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="relative max-w-md" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <input
            id="order-search"
            name="q"
            defaultValue={q}
            placeholder="Search order number, name, email or phone…"
            className="w-full pl-8 pr-3 py-2 bg-ivory-2 border border-stone rounded text-xs focus:ring-1 focus:ring-navy"
          />
          <Search className="w-3.5 h-3.5 text-text-3 absolute left-2.5 top-2.5" aria-hidden="true" />
        </form>
      </div>

      <div className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders found" body={q ? 'Try a different search.' : 'Orders will appear here as customers check out.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Placed</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-ivory-2/50 transition">
                    <td className="p-3 font-mono font-semibold text-navy">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.order_number}</Link>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-navy">{o.customer_name}</p>
                      <p className="text-[11px] text-text-3">{o.customer_email}</p>
                    </td>
                    <td className="p-3">
                      <p className="line-clamp-1">{o.items[0]?.name_snapshot}</p>
                      {o.items.length > 1 && <span className="text-[10px] text-text-3">+{o.items.length - 1} more</span>}
                    </td>
                    <td className="p-3 font-semibold text-navy">{formatNaira(o.total_kobo)}</td>
                    <td className="p-3">{o.payment ? <PaymentStatusBadge status={o.payment.status} /> : <span className="text-text-3">—</span>}</td>
                    <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="p-3 text-text-3 whitespace-nowrap">{formatDateTime(o.placed_at)}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/orders/${o.id}`} className="px-2.5 py-1 bg-ivory-2 hover:bg-stone text-navy rounded border border-stone font-medium inline-block text-[11px]">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
