'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartContext';
import { useStoreSettings } from '@/components/providers/StoreSettingsProvider';
import { calculateTotal, formatNaira } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { Trash2, ArrowRight, ShoppingBag, MessageCircle, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { items, subtotalKobo, format, updateQty, removeItem } = useCart();
  const { delivery_rules: DELIVERY_OPTIONS, contact } = useStoreSettings();
  const [selectedId, setSelectedId] = useState<string>(DELIVERY_OPTIONS[0]?.id ?? '');
  const selectedDelivery = DELIVERY_OPTIONS.find((d) => d.id === selectedId) ?? DELIVERY_OPTIONS[0];

  const totalKobo = calculateTotal(subtotalKobo, selectedDelivery?.fee_kobo ?? 0);

  // Prefilled WhatsApp order text
  const itemsText = items
    .map((i) => `• ${i.name} (Size: ${i.size_label}, ${i.fit_type === 'bespoke' ? 'Made to measure' : 'Ready to wear'}, Qty: ${i.qty})`)
    .join('\n');
  const whatsappHref = whatsappUrl(
    contact.whatsapp,
    `Hello A-Plus Fashion, I would like to place an order for:\n${itemsText}\n\nSubtotal: ${formatNaira(subtotalKobo)}`
  );

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-ivory-2 border border-stone flex items-center justify-center text-text-3">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-3xl text-navy">Your Shopping Bag is Empty</h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-md mx-auto">
          Explore our collection of bespoke suits, wedding tuxedos, and tailored blazers. Every piece is handcrafted with precision in Ijebu-Ode.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-4 bg-navy text-ivory font-semibold text-sm rounded hover:bg-navy-2 transition shadow-md touch-target"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="border-b border-stone pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">Shopping Bag</h1>
        <p className="text-xs text-text-3 mt-1">Review your selected garments before secure checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Items List */}
        <div className="lg:col-span-8 bg-white border border-stone rounded-lg divide-y divide-stone overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Product Thumbnail */}
              <div className="w-24 h-32 relative rounded bg-ivory-2 overflow-hidden flex-shrink-0 border border-stone">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover object-top"
                  sizes="100px"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-serif text-base sm:text-lg font-semibold text-navy hover:text-gold-dark transition"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-text-3 hover:text-aplus-error p-1 transition"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-text-2 mt-2">
                    <span className="bg-ivory-2 px-2 py-0.5 rounded border border-stone">
                      Size: <strong>{item.size_label}</strong>
                    </span>
                    <span className="bg-ivory-2 px-2 py-0.5 rounded border border-stone capitalize">
                      Fit: <strong>{item.fit_type.replace('_', ' ')}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone/50">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-stone rounded bg-ivory-2">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="px-3 py-1 text-xs text-navy font-bold hover:bg-stone transition"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-semibold text-navy min-w-[28px] text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="px-3 py-1 text-xs text-navy font-bold hover:bg-stone transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <span className="font-serif font-bold text-navy text-base">
                    {format(item.unit_price_kobo * item.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-stone rounded-lg p-6 space-y-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-3">
              Order Summary
            </h2>

            {/* Delivery Option Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider">
                Select Delivery Destination
              </label>
              <div className="space-y-2 text-xs">
                {DELIVERY_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`block p-2.5 rounded border cursor-pointer transition ${
                      selectedDelivery?.id === opt.id
                        ? 'border-navy bg-navy/5 text-navy font-medium'
                        : 'border-stone hover:bg-ivory-2'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="delivery_option"
                          checked={selectedDelivery?.id === opt.id}
                          onChange={() => setSelectedId(opt.id)}
                          className="text-navy focus:ring-navy"
                        />
                        <span>{opt.label}</span>
                      </div>
                      <span className="font-semibold">
                        {opt.fee_kobo === 0 ? 'FREE' : format(opt.fee_kobo)}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-3 block ml-5 mt-0.5">
                      ETA: {opt.eta}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-stone text-xs text-text-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-navy">{format(subtotalKobo)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-navy">
                  {!selectedDelivery || selectedDelivery.fee_kobo === 0 ? 'FREE' : format(selectedDelivery.fee_kobo)}
                </span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-navy pt-2 border-t border-stone">
                <span>Estimated Total</span>
                <span>{format(totalKobo)}</span>
              </div>
              <p className="text-[10px] text-text-3">
                All transactions are verified and processed in Nigerian Naira (NGN).
              </p>
            </div>

            {/* Checkout CTAs */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/checkout?del=${selectedDelivery?.id ?? ''}`}
                className="w-full py-4 bg-navy hover:bg-navy-2 text-ivory font-semibold text-xs rounded transition flex items-center justify-center space-x-2 shadow-md touch-target"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-transparent hover:bg-emerald-50 text-emerald-800 border border-emerald-600 font-semibold text-xs rounded transition flex items-center justify-center space-x-2 touch-target"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Order Bag via WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-[11px] text-text-3">
              <ShieldCheck className="w-4 h-4 text-aplus-success flex-shrink-0" />
              <span>Secured 256-bit SSL Paystack checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
