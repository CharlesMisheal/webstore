'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { formatMoney, calculateTotal, generateOrderNumber } from '@/lib/money';
import { ShieldCheck, Lock, ArrowRight, MessageCircle } from 'lucide-react';

const DELIVERY_OPTIONS = [
  { id: 'del_lagos_ogun', label: 'Lagos & Ogun Express Courier', fee_kobo: 450000, eta: '1–3 business days' },
  { id: 'del_nationwide', label: 'Nationwide Nigeria (Courier / Waybill)', fee_kobo: 750000, eta: '3–5 business days' },
  { id: 'del_pickup', label: 'Shop Pick-up (2 Jagunmolu St, Ijebu-Ode)', fee_kobo: 0, eta: 'Ready within 24 hours' },
  { id: 'del_intl', label: 'International Express (DHL Worldwide)', fee_kobo: 4500000, eta: '5–8 business days' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalKobo, currency, clearCart } = useCart();

  const [deliveryOption, setDeliveryOption] = useState(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const preselectedDelId = params.get('del') || 'del_lagos_ogun';
    return DELIVERY_OPTIONS.find((d) => d.id === preselectedDelId) || DELIVERY_OPTIONS[0];
  });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalKobo = calculateTotal(subtotalKobo, deliveryOption.fee_kobo);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-navy">Your bag is empty</h2>
        <p className="text-xs text-text-2">Add a bespoke suit or blazer to your cart before proceeding to checkout.</p>
        <Link href="/shop" className="inline-block px-6 py-3 bg-navy text-ivory text-xs font-semibold rounded">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();

      const payload = {
        order_number: orderNumber,
        customer_name: fullName,
        customer_email: email,
        customer_phone: phone,
        subtotal_kobo: subtotalKobo,
        delivery_fee_kobo: deliveryOption.fee_kobo,
        total_kobo: totalKobo,
        currency: 'NGN',
        shipping_address: {
          fullName,
          email,
          phone,
          address,
          city,
          state,
          country: 'Nigeria',
          deliveryOptionId: deliveryOption.id,
          deliveryMethod: deliveryOption.label,
          deliveryNotes: notes,
        },
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          name_snapshot: i.name,
          size_snapshot: i.size_label,
          fit_type: i.fit_type,
          unit_price_kobo: i.unit_price_kobo,
          qty: i.qty,
          line_total_kobo: i.unit_price_kobo * i.qty,
          image_snapshot: i.image_url,
        })),
      };

      // Call API to initialize transaction and record pending order
      const res = await fetch('/api/pay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      clearCart();

      // Redirect to authorization URL or confirmation callback
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        router.push(`/order/${orderNumber}/confirmation?reference=${data.reference}`);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'An unexpected error occurred during checkout');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="border-b border-stone pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">Checkout</h1>
        <p className="text-xs text-text-3 mt-1">
          Complete your delivery details and proceed to Paystack secure payment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery and Customer Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone space-y-4">
            <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
              1. Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-navy mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chief Babatunde Adeleke"
                  className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-navy mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-navy mb-1">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-stone space-y-4">
            <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
              2. Shipping Address & Destination
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, Street name, Estate"
                  className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-navy mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ikeja, Lekki, Ijebu-Ode, Abuja"
                    className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-navy mb-1">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                  >
                    <option value="Lagos">Lagos State</option>
                    <option value="Ogun">Ogun State</option>
                    <option value="Abuja">Abuja FCT</option>
                    <option value="Oyo">Oyo State</option>
                    <option value="Rivers">Rivers State</option>
                    <option value="Edo">Edo State</option>
                    <option value="Other">Other State / International</option>
                  </select>
                </div>
              </div>

              {/* Delivery Courier Selection */}
              <div>
                <label className="block font-medium text-navy mb-2">Delivery Service Option</label>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`block p-3 rounded border cursor-pointer transition ${
                        deliveryOption.id === opt.id
                          ? 'border-navy bg-navy/5 text-navy font-medium'
                          : 'border-stone hover:bg-ivory-2'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="delivery_courier"
                            checked={deliveryOption.id === opt.id}
                            onChange={() => setDeliveryOption(opt)}
                            className="text-navy focus:ring-navy"
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span className="font-semibold">
                          {opt.fee_kobo === 0 ? 'FREE' : formatMoney(opt.fee_kobo, currency)}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-3 block ml-5">ETA: {opt.eta}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Special Delivery / Sizing Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Leave with security, custom sleeve length notes..."
                  className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Paystack Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone space-y-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
              Order Summary ({items.length} {items.length === 1 ? 'garment' : 'garments'})
            </h2>

            {/* Line items mini-list */}
            <div className="divide-y divide-stone max-h-60 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="py-2.5 flex space-x-3 text-xs">
                  <div className="w-12 h-14 relative rounded bg-ivory-2 overflow-hidden flex-shrink-0 border border-stone">
                    <Image src={i.image_url} alt={i.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy line-clamp-1">{i.name}</p>
                    <p className="text-[11px] text-text-3">
                      Size: {i.size_label} • Qty: {i.qty}
                    </p>
                    <p className="font-medium text-navy mt-0.5">
                      {formatMoney(i.unit_price_kobo * i.qty, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation Totals */}
            <div className="border-t border-stone pt-3 space-y-1.5 text-xs text-text-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-navy">{formatMoney(subtotalKobo, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({deliveryOption.label})</span>
                <span className="font-semibold text-navy">
                  {deliveryOption.fee_kobo === 0 ? 'FREE' : formatMoney(deliveryOption.fee_kobo, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-navy pt-2 border-t border-stone">
                <span>Total Due</span>
                <span>{formatMoney(totalKobo, currency)}</span>
              </div>
              <p className="text-[10px] text-text-3">
                Calculated strictly in integer kobo: ₦{(totalKobo / 100).toLocaleString('en-NG')}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Paystack Payment Trigger */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory font-semibold text-xs rounded shadow-md transition flex items-center justify-center space-x-2 touch-target"
              >
                <Lock className="w-4 h-4 text-gold-light" />
                <span>
                  {isSubmitting ? 'Securing Paystack Session...' : `Pay Securely via Paystack • ${formatMoney(totalKobo, currency)}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-ivory-2 rounded border border-stone text-center text-[11px] text-text-3 space-y-1">
                <div className="flex items-center justify-center space-x-1.5 font-semibold text-navy">
                  <ShieldCheck className="w-4 h-4 text-aplus-success" />
                  <span>Official Paystack Gateway Protection</span>
                </div>
                <p>Supports Debit Cards (Mastercard, Visa, Verve), Direct Bank Transfer, & USSD.</p>
              </div>

              {/* WhatsApp Fallback */}
              <div className="pt-2 text-center">
                <a
                  href={`https://wa.me/2347071374515?text=Hello%20A-Plus%2C%20I%20prefer%20to%20complete%20my%20checkout%20via%20WhatsApp.%20Total%3A%20₦${(totalKobo / 100).toLocaleString('en-NG')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-700 hover:underline inline-flex items-center space-x-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Prefer to transfer and confirm directly? Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
