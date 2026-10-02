import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { getCustomerDetail, getBookingsForCustomer, getQuotesForCustomer } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { AdminPageHeader, formatDate, formatDateTime } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();
  const { customer, orders, profile } = detail;
  const [quotes, bookings] = await Promise.all([getQuotesForCustomer(customer.email), getBookingsForCustomer(customer.email)]);
  const m = profile?.measurements;

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center space-x-1 text-xs text-text-3 hover:text-navy">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        <span>All customers</span>
      </Link>

      <AdminPageHeader
        eyebrow={customer.is_guest ? 'Guest customer' : 'Customer account'}
        title={customer.full_name || customer.email}
        description={`${customer.order_count} order(s) · ${formatNaira(customer.total_spent_kobo)} lifetime · ${customer.is_guest ? 'checked out as guest' : `joined ${formatDate(customer.created_at)}`}`}
        actions={
          customer.phone ? (
            <a href={whatsappUrl(customer.phone, `Hello ${customer.full_name}, this is A-Plus Fashion Home.`)} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded inline-flex items-center space-x-1.5">
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-lg border border-stone p-4 text-xs space-y-1.5">
            <h2 className="font-serif text-base font-semibold text-navy mb-2">Contact</h2>
            <p><a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a></p>
            <p>{customer.phone ? <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a> : <span className="text-text-3">No phone</span>}</p>
            <p className="text-text-3">{customer.country || 'Nigeria'}</p>
          </section>

          <section className="bg-white rounded-lg border border-stone p-4 text-xs">
            <h2 className="font-serif text-base font-semibold text-navy mb-2">Saved measurements</h2>
            {!m || Object.values(m).every((v) => !v) ? (
              <p className="text-text-3">{customer.is_guest ? 'Guests cannot save measurements.' : 'Customer has not saved measurements yet.'}</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {(['chest', 'waist', 'shoulder', 'sleeve', 'height'] as const).map((k) => (
                  <React.Fragment key={k}>
                    <dt className="text-text-3 capitalize">{k}</dt>
                    <dd className="font-medium text-navy">{m[k] || '—'}</dd>
                  </React.Fragment>
                ))}
                {m.notes && (
                  <>
                    <dt className="text-text-3">Notes</dt>
                    <dd className="col-span-2 italic text-text-2">{m.notes}</dd>
                  </>
                )}
              </dl>
            )}
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-lg border border-stone overflow-hidden">
            <h2 className="font-serif text-base font-semibold text-navy p-4 border-b border-stone">Orders</h2>
            {orders.length === 0 ? (
              <p className="p-4 text-xs text-text-3">No orders.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-stone">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-ivory-2/50">
                      <td className="p-3 font-mono font-semibold text-navy"><Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.order_number}</Link></td>
                      <td className="p-3 text-text-2">{o.items.length} item(s)</td>
                      <td className="p-3 font-semibold">{formatNaira(o.total_kobo)}</td>
                      <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="p-3 text-text-3 text-right">{formatDateTime(o.placed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="bg-white rounded-lg border border-stone overflow-hidden">
            <h2 className="font-serif text-base font-semibold text-navy p-4 border-b border-stone">Quotes & bookings</h2>
            {quotes.length === 0 && bookings.length === 0 ? (
              <p className="p-4 text-xs text-text-3">No bespoke requests or fittings.</p>
            ) : (
              <ul className="divide-y divide-stone text-xs">
                {quotes.map((q) => (
                  <li key={q.id} className="p-3 flex justify-between gap-3">
                    <div>
                      <span className="font-mono font-semibold text-navy">{q.reference}</span>
                      <span className="text-text-2"> · {q.garment} for {q.occasion}</span>
                    </div>
                    <Link href="/admin/requests?tab=quotes" className="text-gold-dark hover:underline capitalize whitespace-nowrap">{q.status.replace('_', ' ')} →</Link>
                  </li>
                ))}
                {bookings.map((b) => (
                  <li key={b.id} className="p-3 flex justify-between gap-3">
                    <div>
                      <span className="font-mono font-semibold text-navy">{b.reference}</span>
                      <span className="text-text-2"> · {b.type === 'shop' ? 'In-shop' : 'Video'} fitting · {formatDateTime(b.starts_at)}</span>
                    </div>
                    <Link href="/admin/requests?tab=bookings" className="text-gold-dark hover:underline capitalize whitespace-nowrap">{b.status} →</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
