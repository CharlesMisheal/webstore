import React from 'react';
import Link from 'next/link';
import { getOrderByNumber, getStoreSettings } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { Search, CheckCircle2, Circle, Clock, Truck, Package, MessageCircle, ExternalLink } from 'lucide-react';

interface TrackPageProps {
  searchParams: {
    order?: string;
  };
}

export default async function OrderTrackingPage({ searchParams }: TrackPageProps) {
  const orderNumber = searchParams.order?.trim();
  const [order, settings] = await Promise.all([orderNumber ? getOrderByNumber(orderNumber) : Promise.resolve(null), getStoreSettings()]);

  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received by tailoring desk' },
    { key: 'paid', label: 'Payment Confirmed', desc: 'Fabric reserved & pre-shrunk' },
    { key: 'processing', label: 'Tailoring in Progress', desc: 'Pattern cutting & hand-stitching' },
    { key: 'shipped', label: 'Dispatched with Courier', desc: 'En route to your address' },
    { key: 'delivered', label: 'Delivered', desc: 'Ready for your special occasion' },
  ];

  const getStepStatus = (stepKey: string, currentStatus?: string) => {
    if (!currentStatus) return 'upcoming';
    const orderProgression = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
    const currentIdx = orderProgression.indexOf(currentStatus);
    const stepIdx = ['placed', 'paid', 'processing', 'shipped', 'delivered'].indexOf(stepKey);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Live Tracking
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Track Your Tailoring Order
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-md mx-auto">
          Enter your A-Plus order number (e.g. <code className="text-navy font-semibold">APF-261001-8392</code>) to check production and courier dispatch status.
        </p>

        {/* Search Bar */}
        <form action="/track" method="GET" className="max-w-md mx-auto pt-2 flex">
          <input
            type="text"
            name="order"
            defaultValue={orderNumber || ''}
            placeholder="Enter Order Number (APF-...)"
            className="flex-1 px-4 py-3 text-xs bg-white border border-stone rounded-l focus:outline-none focus:ring-1 focus:ring-navy"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded-r transition flex items-center space-x-1.5"
          >
            <Search className="w-4 h-4 text-gold-light" />
            <span>Track</span>
          </button>
        </form>
      </div>

      {orderNumber && !order && (
        <div className="bg-white p-8 rounded-lg border border-stone text-center space-y-3">
          <p className="font-serif text-lg text-navy">No order found with number &ldquo;{orderNumber}&rdquo;</p>
          <p className="text-xs text-text-3">Please check the confirmation email or WhatsApp receipt sent to you.</p>
          <a
            href={whatsappUrl(settings.contact.whatsapp, `Hello Henry, could you help me find my order status? I searched for "${orderNumber}".`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-700 hover:underline pt-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Inquire directly on WhatsApp</span>
          </a>
        </div>
      )}

      {order && (
        <div className="bg-white border border-stone rounded-lg p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone">
            <div>
              <span className="text-xs text-text-3">Order Number</span>
              <h2 className="font-serif text-2xl font-bold text-navy">{order.order_number}</h2>
              <p className="text-xs text-text-2 mt-1">Customer: {order.customer_name}</p>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className="text-xs text-text-3 block">Status</span>
              <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded bg-navy text-gold-light">
                {order.status}
              </span>
            </div>
          </div>

          {/* 5-Step Timeline */}
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-dark">
              Production & Delivery Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {steps.map((st, i) => {
                const status = getStepStatus(st.key, order.status);
                return (
                  <div key={st.key} className="flex md:flex-col items-center md:items-start space-x-3 md:space-x-0 space-y-0 md:space-y-2">
                    <div className="flex items-center justify-center">
                      {status === 'completed' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-aplus-success flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {status === 'current' && (
                        <div className="w-8 h-8 rounded-full bg-navy text-gold-light flex items-center justify-center animate-pulse">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      {status === 'upcoming' && (
                        <div className="w-8 h-8 rounded-full bg-ivory-2 text-stone-border flex items-center justify-center border border-stone">
                          <Circle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${status === 'current' ? 'text-navy' : status === 'completed' ? 'text-emerald-800' : 'text-text-3'}`}>
                        {st.label}
                      </p>
                      <p className="text-[11px] text-text-3 hidden md:block mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* External Courier Tracking Link if Shipped */}
          {order.tracking_url && (
            <div className="p-4 bg-navy-2 text-ivory rounded border border-gold/40 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-gold-light" />
                <div>
                  <p className="font-semibold">Courier Tracking Active</p>
                  <p className="text-stone">Dispatched via logistics partner</p>
                </div>
              </div>
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gold hover:bg-gold-light text-navy font-semibold rounded flex items-center space-x-1.5 transition"
              >
                <span>View Waybill</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Order Details Accordion */}
          <div className="pt-4 border-t border-stone space-y-3 text-xs">
            <h4 className="font-semibold text-navy">Ordered Garments</h4>
            <div className="divide-y divide-stone">
              {order.items.map((i) => (
                <div key={i.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-navy">{i.name_snapshot}</span>
                    <span className="text-text-3 ml-2">Size: {i.size_snapshot} • Qty: {i.qty}</span>
                  </div>
                  <span className="font-semibold">{formatNaira(i.line_total_kobo)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-navy text-sm pt-2">
              <span>Total Paid</span>
              <span>{formatNaira(order.total_kobo)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
