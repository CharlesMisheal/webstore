'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStoreSettings } from '@/components/providers/StoreSettingsProvider';
import { whatsappUrl } from '@/lib/whatsapp';
import { Calendar, Video, MapPin, CheckCircle2, MessageCircle, Clock, ArrowRight } from 'lucide-react';

export default function BookingPage() {
  const [bookingType, setBookingType] = useState<'shop' | 'video'>('shop');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ reference: string } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const { contact } = useStoreSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Interpret the chosen slot in the shopper's local timezone, send as ISO.
      const local = new Date(`${appointmentDate}T${appointmentTime}:00`);
      if (Number.isNaN(local.getTime())) {
        setErrorMsg('Please choose a valid date and time.');
        return;
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          type: bookingType,
          starts_at: local.toISOString(),
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.message || 'We could not save your booking. Please try again.');
        return;
      }
      setBookingResult({ reference: data.reference });
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-aplus-success flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Fitting Consultation Booked
        </span>
        <h1 className="font-serif text-3xl text-navy">
          Appointment Scheduled, {customerName}!
        </h1>

        <div className="bg-white p-6 rounded border border-stone shadow-sm text-xs space-y-3 text-left">
          <div className="flex justify-between items-center border-b border-stone pb-2">
            <span className="text-text-3">Booking Reference:</span>
            <code className="text-sm font-mono font-bold text-navy">{bookingResult.reference}</code>
          </div>
          <p className="text-text-2">
            <strong>Appointment Type:</strong> {bookingType === 'shop' ? `In-Person at ${contact.address}` : 'Live WhatsApp Video Consultation'}
          </p>
          <p className="text-text-2">
            <strong>Date & Time:</strong> {appointmentDate} at {appointmentTime}
          </p>
          <p className="text-text-3 mt-2">
            A confirmation reminder has been recorded. For video fittings, please have a standard soft measuring tape on hand.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a
            href={whatsappUrl(contact.whatsapp, `Hello Henry, I have scheduled fitting appointment ${bookingResult.reference} for ${appointmentDate} at ${appointmentTime}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs rounded transition flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Confirm on WhatsApp</span>
          </a>
          <Link
            href="/shop"
            className="px-6 py-3 bg-navy hover:bg-navy-2 text-ivory font-semibold text-xs rounded transition"
          >
            Explore Suit Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-navy text-gold-light text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>Fitting Consultation</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Book a Fitting Consultation
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto">
          Choose between an in-person bespoke fitting at our Ijebu-Ode atelier or a convenient one-on-one live video measurement session.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-lg border border-stone shadow-sm space-y-8">
        {/* Step 1: Type Selection */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
            1. Consultation Method
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setBookingType('shop')}
              className={`p-4 rounded-lg border text-left transition flex items-start space-x-3.5 ${
                bookingType === 'shop'
                  ? 'border-navy bg-navy text-ivory shadow-md'
                  : 'border-stone bg-ivory-2 text-text hover:border-gold'
              }`}
            >
              <MapPin className={`w-5 h-5 flex-shrink-0 mt-0.5 ${bookingType === 'shop' ? 'text-gold-light' : 'text-gold-dark'}`} />
              <div>
                <h3 className="font-semibold text-sm">Ijebu-Ode Workshop Fitting</h3>
                <p className={`text-xs mt-1 leading-relaxed ${bookingType === 'shop' ? 'text-stone' : 'text-text-3'}`}>
                  Visit our Ijebu-Ode workshop. Touch fabrics, inspect lapel silhouettes, and get measured by Henry.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingType('video')}
              className={`p-4 rounded-lg border text-left transition flex items-start space-x-3.5 ${
                bookingType === 'video'
                  ? 'border-navy bg-navy text-ivory shadow-md'
                  : 'border-stone bg-ivory-2 text-text hover:border-gold'
              }`}
            >
              <Video className={`w-5 h-5 flex-shrink-0 mt-0.5 ${bookingType === 'video' ? 'text-gold-light' : 'text-gold-dark'}`} />
              <div>
                <h3 className="font-semibold text-sm">Live Video Call Consultation</h3>
                <p className={`text-xs mt-1 leading-relaxed ${bookingType === 'video' ? 'text-stone' : 'text-text-3'}`}>
                  Ideal for clients in Lagos, Abuja, London, USA or worldwide. Guided measurement via WhatsApp video.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Date & Time */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
            2. Preferred Appointment Slot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-navy mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-navy mb-1">Preferred Time *</label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
              >
                <option value="10:00">10:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="13:00">1:00 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Contact Details */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-navy border-b border-stone pb-2">
            3. Client Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-navy mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Dr. Olumide Balogun"
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
              <label className="block font-medium text-navy mb-1">WhatsApp Phone *</label>
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
          <div>
            <label className="block font-medium text-navy mb-1 text-xs">Garments of Interest & Special Requests</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preparing for groom attire and 4 groomsmen suits..."
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy text-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-stone space-y-3">
          {errorMsg && (
            <p role="alert" className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200">
              {errorMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="w-full py-4 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory font-semibold text-xs rounded transition flex items-center justify-center space-x-2 shadow-md touch-target"
          >
            <span>{isSubmitting ? 'Confirming Appointment...' : 'Confirm Fitting Consultation'}</span>
            <ArrowRight className="w-4 h-4 text-gold-light" />
          </button>
        </div>
      </form>
    </div>
  );
}
