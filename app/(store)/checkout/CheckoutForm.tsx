'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { useStoreSettings } from '@/components/providers/StoreSettingsProvider';
import { calculateTotal } from '@/lib/money';
import { whatsappUrl } from '@/lib/whatsapp';
import { ShieldCheck, Lock, ArrowRight, MessageCircle, AlertTriangle } from 'lucide-react';

const NIGERIAN_STATES = [
  'Lagos', 'Ogun', 'Abuja (FCT)', 'Oyo', 'Rivers', 'Edo', 'Delta', 'Kaduna', 'Kano', 'Enugu', 'Anambra', 'Akwa Ibom',
  'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Imo', 'Abia', 'Cross River', 'Plateau', 'Other',
];

const inputClass = 'w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs min-h-[44px]';

export function CheckoutForm({ signedInEmail, signedInName }: { signedInEmail: string; signedInName: string }) {
  const searchParams = useSearchParams();
  const { items, subtotalKobo, format } = useCart();
  const { delivery_rules: deliveryRules, contact } = useStoreSettings();

  const [deliveryOptionId, setDeliveryOptionId] = useState<string>('');
  const [fullName, setFullName] = useState(signedInName ?? '');
  const [email, setEmail] = useState(signedInEmail ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [country, setCountry] = useState('Nigeria');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  // Preselect delivery option from ?del= (set by the cart page), else the first rule.
  useEffect(() => {
    const wanted = searchParams.get('del');
    const match = deliveryRules.find((r) => r.id === wanted) || deliveryRules[0];
    if (match && !deliveryOptionId) setDeliveryOptionId(match.id);
  }, [searchParams, deliveryRules, deliveryOptionId]);

  const deliveryRule = useMemo(() => deliveryRules.find((r) => r.id === deliveryOptionId) || deliveryRules[0], [deliveryRules, deliveryOptionId]);
  const isInternational = deliveryRule?.id === 'del_intl' || country.toLowerCase() !== 'nigeria';
  const totalKobo = calculateTotal(subtotalKobo, deliveryRule?.fee_kobo ?? 0);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl text-navy">Your bag is empty</h1>
        <p className="text-xs text-text-2">Add a suit, tuxedo or blazer before proceeding to checkout.</p>
        <Link href="/shop" className="inline-block px-6 py-3 bg-navy text-ivory text-xs font-semibold rounded">
          Return to Shop
        </Link>
      </div>
    );
  }

  const whatsappFallback = whatsappUrl(
    contact.whatsapp,
    `Hello A-Plus, I'd like to complete my order via WhatsApp/bank transfer.\n\n${items
      .map((i) => `• ${i.name} (${i.size_label}) × ${i.qty}`)
      .join('\n')}\n\nEstimated total: ${format(totalKobo)}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/pay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName, email, phone },
          shipping: { address, city, state, country, deliveryOptionId: deliveryRule.id, deliveryNotes: notes || undefined },
          // Only identifiers + quantities. The server recomputes every price.
          items: items.map((i) => ({ variant_id: i.variant_id, qty: i.qty, fit_type: i.fit_type })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === 'SIGN_IN_REQUIRED') {
          const next = `/checkout?del=${encodeURIComponent(deliveryRule.id)}`;
          window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setError({ message: data.message || 'Payment could not be started.', code: data.code });
        setIsSubmitting(false);
        return;
      }
      // The cart is cleared on the confirmation page once payment is verified,
      // so a cancelled Paystack session does not lose the shopper's bag.
      window.location.assign(data.authorization_url);
    } catch {
      setError({ message: 'Network error. Please check your connection and try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="border-b border-stone pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">Checkout</h1>
        <p className="text-xs text-text-3 mt-1">Enter your delivery details, then pay securely with Paystack. All charges are in Nigerian Naira.</p>
      </div>

      <p className="text-xs text-navy bg-ivory-2 border border-stone rounded px-4 py-3">
        Signed in as <strong>{signedInEmail}</strong>. This order will appear under{' '}
        <Link href="/account" className="underline font-semibold">My account</Link> so you can track it.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8" noValidate>
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white p-6 rounded-lg border border-stone space-y-4" aria-labelledby="customer-heading">
            <h2 id="customer-heading" className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
              1. Your details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block font-medium text-navy mb-1">Full name *</label>
                <input id="fullName" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Babatunde Adeleke" className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="block font-medium text-navy mb-1">Email *</label>
                <input id="email" type="email" required autoComplete="email" value={email} readOnly className={`${inputClass} bg-stone/40 cursor-not-allowed`} />
              </div>
              <div>
                <label htmlFor="phone" className="block font-medium text-navy mb-1">Phone / WhatsApp *</label>
                <input id="phone" type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 803 123 4567" className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg border border-stone space-y-4" aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
              2. Delivery
            </h2>
            <div className="space-y-4 text-xs">
              <fieldset>
                <legend className="block font-medium text-navy mb-2">Delivery option *</legend>
                <div className="space-y-2">
                  {deliveryRules.map((opt) => {
                    const selected = deliveryRule?.id === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`block p-3 rounded border cursor-pointer transition ${selected ? 'border-navy bg-navy/5 text-navy font-medium' : 'border-stone hover:bg-ivory-2'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input type="radio" name="delivery_option" value={opt.id} checked={selected} onChange={() => setDeliveryOptionId(opt.id)} className="text-navy focus:ring-navy" />
                            <span>{opt.label}</span>
                          </div>
                          <span className="font-semibold">{opt.fee_kobo === 0 ? 'FREE' : format(opt.fee_kobo)}</span>
                        </div>
                        <span className="text-[11px] text-text-3 block ml-5">ETA: {opt.eta}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="address" className="block font-medium text-navy mb-1">Street address *</label>
                <input id="address" type="text" required autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House number, street, estate" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block font-medium text-navy mb-1">City / town *</label>
                  <input id="city" type="text" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lekki, Ijebu-Ode" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="state" className="block font-medium text-navy mb-1">State / region *</label>
                  {isInternational ? (
                    <input id="state" type="text" required value={state} onChange={(e) => setState(e.target.value)} placeholder="State / province" className={inputClass} />
                  ) : (
                    <select id="state" value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor="country" className="block font-medium text-navy mb-1">Country *</label>
                  <input id="country" type="text" required autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block font-medium text-navy mb-1">Delivery or sizing notes (optional)</label>
                <textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Leave with security; sleeve length preference…" className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs" />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white p-6 rounded-lg border border-stone space-y-5 shadow-sm lg:sticky lg:top-28" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
              Order summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>

            <ul className="divide-y divide-stone max-h-60 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.id} className="py-2.5 flex space-x-3 text-xs">
                  <div className="w-12 h-14 relative rounded bg-ivory-2 overflow-hidden flex-shrink-0 border border-stone">
                    <Image src={i.image_url} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy line-clamp-1">{i.name}</p>
                    <p className="text-[11px] text-text-3">
                      Size {i.size_label} · {i.fit_type === 'bespoke' ? 'Made to measure' : 'Ready to wear'} · Qty {i.qty}
                    </p>
                    <p className="font-medium text-navy mt-0.5">{format(i.unit_price_kobo * i.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-stone pt-3 space-y-1.5 text-xs text-text-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-navy">{format(subtotalKobo)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery · {deliveryRule?.label}</span>
                <span className="font-semibold text-navy">{deliveryRule?.fee_kobo === 0 ? 'FREE' : format(deliveryRule?.fee_kobo ?? 0)}</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-navy pt-2 border-t border-stone">
                <span>Total due</span>
                <span>{format(totalKobo)}</span>
              </div>
              <p className="text-[10px] text-text-3">Charged in NGN. Other currencies are estimates. Final amount is confirmed on the server before Paystack opens.</p>
            </div>

            {error && (
              <div role="alert" className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p>{error.message}</p>
                  {(error.code === 'OUT_OF_STOCK' || error.code === 'VARIANT_NOT_FOUND' || error.code === 'PRODUCT_UNAVAILABLE') && (
                    <Link href="/cart" className="underline font-semibold">Review your bag</Link>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !deliveryRule}
                aria-busy={isSubmitting}
                className="w-full py-4 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory font-semibold text-xs rounded shadow-md transition flex items-center justify-center space-x-2 min-h-[48px]"
              >
                <Lock className="w-4 h-4 text-gold-light" aria-hidden="true" />
                <span>{isSubmitting ? 'Opening secure Paystack checkout…' : `Pay securely with Paystack · ${format(totalKobo)}`}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="p-3 bg-ivory-2 rounded border border-stone text-center text-[11px] text-text-3 space-y-1">
                <div className="flex items-center justify-center space-x-1.5 font-semibold text-navy">
                  <ShieldCheck className="w-4 h-4 text-aplus-success" aria-hidden="true" />
                  <span>Secured by Paystack</span>
                </div>
                <p>Cards (Mastercard, Visa, Verve), bank transfer and USSD.</p>
              </div>

              <div className="pt-2 text-center">
                <a href={whatsappFallback} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline inline-flex items-center space-x-1">
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Prefer bank transfer? Order via WhatsApp</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
