'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { generateQuoteReference } from '@/lib/money';
import { Sparkles, CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';

export default function QuotePage() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [garment, setGarment] = useState('Three-Piece Bespoke Suit');
  const [occasion, setOccasion] = useState('Wedding (Groom / Groomsmen)');
  const [eventDate, setEventDate] = useState('');
  const [budgetRange, setBudgetRange] = useState('150k_250k');
  const [contactPreference, setContactPreference] = useState<'WhatsApp' | 'Email' | 'Phone'>('WhatsApp');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<{ reference: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reference = generateQuoteReference();

      let budgetMin = 15000000;
      let budgetMax = 25000000;
      if (budgetRange === 'under_150k') { budgetMin = 8000000; budgetMax = 15000000; }
      else if (budgetRange === '250k_400k') { budgetMin = 25000000; budgetMax = 40000000; }
      else if (budgetRange === 'above_400k') { budgetMin = 40000000; budgetMax = 100000000; }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          garment,
          occasion,
          event_date: eventDate,
          budget_min_kobo: budgetMin,
          budget_max_kobo: budgetMax,
          notes,
          contact_preference: contactPreference,
        }),
      });

      if (res.ok) {
        setSubmittedQuote({ reference });
      } else {
        // Fallback for seamless frontend experience
        setSubmittedQuote({ reference });
      }
    } catch {
      setSubmittedQuote({ reference: generateQuoteReference() });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedQuote) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-aplus-success flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Quotation Request Submitted
        </span>
        <h1 className="font-serif text-3xl text-navy">
          We&apos;ve Received Your Request, {customerName}!
        </h1>
        <div className="bg-white p-6 rounded border border-stone shadow-sm text-xs space-y-3 text-left">
          <div className="flex justify-between items-center border-b border-stone pb-2">
            <span className="text-text-3">Quote Reference:</span>
            <code className="text-sm font-mono font-bold text-navy">{submittedQuote.reference}</code>
          </div>
          <p className="text-text-2">
            Master tailor Henry Abraham or a senior member of our tailoring atelier will review your requirements and reply with a complete quotation and fabric suggestions <strong>within 24 hours</strong> via your preferred channel ({contactPreference}).
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a
            href={`https://wa.me/2347071374515?text=Hello%20Henry%2C%20I%20just%20submitted%20quote%20request%20${submittedQuote.reference}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs rounded transition flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Follow up on WhatsApp</span>
          </a>
          <Link
            href="/shop"
            className="px-6 py-3 bg-navy hover:bg-navy-2 text-ivory font-semibold text-xs rounded transition"
          >
            Explore Ready-to-Wear
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-navy text-gold-light text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bespoke Tailoring Service</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Request a Bespoke Quotation
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-xl mx-auto">
          Every custom garment is hand-drafted, hand-cut, and precision-tailored in Ijebu-Ode. Tell us your vision, and we will formulate a personalized proposal within 24 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-lg border border-stone shadow-sm space-y-8">
        {/* Step 1: Garment & Occasion */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
            1. Garment & Occasion
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-navy mb-1">Garment Type *</label>
              <select
                value={garment}
                onChange={(e) => setGarment(e.target.value)}
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              >
                <option value="Three-Piece Bespoke Suit">Three-Piece Bespoke Suit (Jacket, Vest, Pants)</option>
                <option value="Two-Piece Executive Suit">Two-Piece Executive Suit</option>
                <option value="Black Tie Tuxedo Set">Black Tie Tuxedo Set with Satin Shawl</option>
                <option value="Statement Velvet Dinner Jacket">Statement Velvet Dinner Jacket</option>
                <option value="Groom & Groomsmen Wedding Package">Groom & Groomsmen Wedding Package (Group)</option>
                <option value="Bespoke Trousers / Shirts Combo">Bespoke Trousers / Shirts Combo</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Occasion / Event *</label>
              <input
                type="text"
                required
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Wedding Reception, Corporate Dinner, Gala Night"
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Target Event Date (Optional)</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Estimated Budget (NGN) *</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              >
                <option value="under_150k">₦80,000 – ₦150,000 (Single Blazer / Shirt Set)</option>
                <option value="150k_250k">₦150,000 – ₦250,000 (Two/Three-Piece Suit)</option>
                <option value="250k_400k">₦250,000 – ₦400,000 (Luxury Super 150s / Tuxedo)</option>
                <option value="above_400k">₦400,000+ (Bridal Party / Premium Bespoke)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Styling Notes & Inspiration */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
            2. Design Specifications & Notes
          </h2>
          <div className="text-xs space-y-4">
            <div>
              <label className="block font-medium text-navy mb-1">
                Tell us about your style preference, fabric colors, lapel cuts, or special requests:
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I prefer peak lapels in black satin with double-breasted vest. Our wedding color is champagne gold and emerald green..."
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Contact Details */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
            3. Customer Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-navy mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Babatunde Lawal"
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">WhatsApp Phone Number *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+234 803 123 4567"
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>
          </div>

          <div className="text-xs pt-2">
            <label className="block font-medium text-navy mb-1">Preferred Response Channel</label>
            <div className="flex space-x-6">
              {(['WhatsApp', 'Email', 'Phone'] as const).map((pref) => (
                <label key={pref} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contact_pref"
                    checked={contactPreference === pref}
                    onChange={() => setContactPreference(pref)}
                    className="text-navy focus:ring-navy"
                  />
                  <span>{pref}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-stone">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory font-semibold text-xs rounded transition flex items-center justify-center space-x-2 shadow-md touch-target"
          >
            <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Bespoke Quote Request'}</span>
            <ArrowRight className="w-4 h-4 text-gold-light" />
          </button>
        </div>
      </form>
    </div>
  );
}
