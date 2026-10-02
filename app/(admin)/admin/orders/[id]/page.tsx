import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, MessageCircle, ExternalLink } from 'lucide-react';
import { getAuditLogsForEntity, getOrderById, getStoreSettings } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/OrderStatusBadge';
import { AdminPageHeader, formatDateTime } from '@/components/admin/AdminPageHeader';
import { OrderActions } from './OrderActions';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, settings] = await Promise.all([getOrderById(params.id), getStoreSettings()]);
  if (!order) notFound();
  const audit = await getAuditLogsForEntity('orders', order.id);
  const addr = order.shipping_address;
  const customerWhatsApp = whatsappUrl(order.customer_phone, `Hello ${order.customer_name}, this is A-Plus Fashion Home about your order ${order.order_number}.`);

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center space-x-1 text-xs text-text-3 hover:text-navy">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        <span>All orders</span>
      </Link>

      <AdminPageHeader
        eyebrow="Order"
        title={order.order_number}
        description={`Placed ${formatDateTime(order.placed_at)} · ${order.items.reduce((s, i) => s + i.qty, 0)} item(s)`}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <Link href={`/admin/orders/${order.id}/invoice`} className="px-3 py-2 bg-white hover:bg-ivory-2 text-navy border border-stone text-xs font-semibold rounded inline-flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Invoice</span>
            </Link>
            <a href={customerWhatsApp} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded inline-flex items-center space-x-1.5">
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WhatsApp customer</span>
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-lg border border-stone overflow-hidden">
            <h2 className="font-serif text-base font-semibold text-navy p-4 border-b border-stone">Items</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                  <th className="p-3">Garment</th>
                  <th className="p-3">Size / fit</th>
                  <th className="p-3 text-right">Unit</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="p-3 font-medium text-navy">
                      {i.product_id ? <Link href={`/admin/products/${i.product_id}`} className="hover:underline">{i.name_snapshot}</Link> : i.name_snapshot}
                    </td>
                    <td className="p-3 text-text-2">{i.size_snapshot} · {i.fit_type === 'bespoke' ? 'Made to measure' : 'Ready to wear'}</td>
                    <td className="p-3 text-right">{formatNaira(i.unit_price_kobo)}</td>
                    <td className="p-3 text-right">{i.qty}</td>
                    <td className="p-3 text-right font-semibold text-navy">{formatNaira(i.line_total_kobo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-xs border-t border-stone">
                <tr><td colSpan={4} className="p-3 text-right text-text-2">Subtotal</td><td className="p-3 text-right font-semibold">{formatNaira(order.subtotal_kobo)}</td></tr>
                <tr><td colSpan={4} className="p-3 text-right text-text-2">Delivery · {addr.deliveryMethod}</td><td className="p-3 text-right font-semibold">{formatNaira(order.delivery_fee_kobo)}</td></tr>
                <tr className="bg-ivory-2"><td colSpan={4} className="p-3 text-right font-bold text-navy">Total</td><td className="p-3 text-right font-bold text-navy text-sm">{formatNaira(order.total_kobo)}</td></tr>
              </tfoot>
            </table>
          </section>

          <section className="bg-white rounded-lg border border-stone p-4 space-y-3">
            <h2 className="font-serif text-base font-semibold text-navy">Payments</h2>
            {(order.payments ?? []).length === 0 ? (
              <p className="text-xs text-text-3">No payment attempt recorded.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-text-3 border-b border-stone">
                    <th className="py-2">Reference</th>
                    <th className="py-2">Channel</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Refund</th>
                    <th className="py-2">Paid at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone">
                  {(order.payments ?? []).map((p) => (
                    <tr key={p.reference}>
                      <td className="py-2 font-mono">{p.reference}</td>
                      <td className="py-2">{p.channel || '—'}</td>
                      <td className="py-2 text-right">{formatNaira(p.amount_kobo)}</td>
                      <td className="py-2"><PaymentStatusBadge status={p.status} /></td>
                      <td className="py-2 uppercase text-[10px] font-semibold">{p.refund_status}</td>
                      <td className="py-2 text-text-3">{formatDateTime(p.paid_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {order.payment?.status === 'success' && (
              <Link href={`/admin/payments?q=${encodeURIComponent(order.order_number)}`} className="text-[11px] text-gold-dark hover:underline inline-flex items-center space-x-1">
                <span>Refund from Payments</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </Link>
            )}
          </section>

          <section className="bg-white rounded-lg border border-stone p-4 space-y-3">
            <h2 className="font-serif text-base font-semibold text-navy">History</h2>
            {audit.length === 0 ? (
              <p className="text-xs text-text-3">No changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-stone text-xs">
                {audit.map((a) => (
                  <li key={a.id} className="py-2 flex justify-between gap-4">
                    <div>
                      <span className="font-semibold text-navy">{a.action}</span>
                      <span className="text-text-3"> by {a.actor_email}</span>
                      {a.after && 'status' in a.after && <span className="text-text-2"> → {String(a.after.status)}</span>}
                    </div>
                    <time dateTime={a.created_at} className="text-text-3 whitespace-nowrap">{formatDateTime(a.created_at)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-lg border border-stone p-4 space-y-2 text-xs">
            <h2 className="font-serif text-base font-semibold text-navy">Customer</h2>
            <p className="font-medium text-navy">{order.customer_name}</p>
            <p><a href={`mailto:${order.customer_email}`} className="hover:underline">{order.customer_email}</a></p>
            <p><a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a></p>
            <div className="pt-2 border-t border-stone text-text-2">
              <p className="font-semibold text-navy text-[11px] uppercase tracking-wider mb-1">Deliver to</p>
              <p>{addr.fullName}</p>
              <p>{addr.address}</p>
              <p>{addr.city}, {addr.state}, {addr.country}</p>
              {addr.deliveryNotes && <p className="mt-1 italic text-text-3">“{addr.deliveryNotes}”</p>}
            </div>
            {order.user_id && (
              <Link href={`/admin/customers/${order.user_id}`} className="text-[11px] text-gold-dark hover:underline">View customer profile →</Link>
            )}
          </section>

          <OrderActions order={order} />

          <p className="text-[11px] text-text-3">
            Store contact for customer messages: {settings.contact.whatsapp}
          </p>
        </div>
      </div>
    </div>
  );
}
