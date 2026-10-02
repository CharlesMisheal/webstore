'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Contact A-Plus Fashion Home
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto">
          Have a question about bespoke sizing, fabric availability, or wedding party deadlines? Reach out to Henry Abraham and our tailoring desk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Workshop Contact Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-navy text-ivory p-8 rounded-lg border border-gold space-y-6">
            <h2 className="font-serif text-xl text-ivory pb-2 border-b border-navy-2">
              Ijebu-Ode Workshop
            </h2>

            <div className="space-y-4 text-xs text-stone">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ivory">Physical Address</h3>
                  <p>2 Jagunmolu Street, Ondo Road, Ijebu-Ode, Ogun State, Nigeria</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ivory">Telephone & Calls</h3>
                  <p>+234 707 137 4515</p>
                  <p className="text-stone/70">Alternate: 09055080524 / 08063124000</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ivory">Email Desk</h3>
                  <p>henryaplus82@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ivory">Opening Hours</h3>
                  <p>Monday – Saturday: 9:00 AM – 6:00 PM</p>
                  <p className="text-stone/70">Sundays: By special appointment only</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-navy-2">
              <a
                href="https://wa.me/2347071374515?text=Hello%20A-Plus%20Fashion%2C%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs rounded transition flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Instant WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-stone shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-navy mb-4 border-b border-stone pb-2">
              Send Us a Message
            </h2>

            {sent ? (
              <div className="p-6 bg-emerald-50 rounded border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-aplus-success flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg text-navy">Message Received!</h3>
                <p className="text-xs text-text-2">
                  Thank you, {name}. Our customer support desk will respond to your inquiry via email or WhatsApp within a few hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-navy mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kolawole Adebayo"
                    className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-navy mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-navy mb-1">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Your Message or Inquiry *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you would like to know..."
                    className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory font-semibold rounded transition flex items-center space-x-2 touch-target"
                >
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  <ArrowRight className="w-4 h-4 text-gold-light" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
