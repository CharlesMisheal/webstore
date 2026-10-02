'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStoreSettings } from '@/components/providers/StoreSettingsProvider';
import { formatPhoneDisplay, normalizeWhatsAppNumber, whatsappUrl } from '@/lib/whatsapp';

const inputClass = 'w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy min-h-[44px]';

export default function ContactPage() {
  const { contact } = useStoreSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.message || 'We could not send your message. Please try again.');
        return;
      }
      setSent(true);
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">Get in Touch</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">Contact A-Plus Fashion Home</h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto">
          Have a question about bespoke sizing, fabric availability, or wedding party deadlines? Reach out to Henry Abraham and our tailoring desk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-navy text-ivory p-8 rounded-lg border border-gold space-y-6">
            <h2 className="font-serif text-xl text-ivory pb-2 border-b border-navy-2">Ijebu-Ode Workshop</h2>

            <address className="not-italic space-y-4 text-xs text-stone">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ivory">Address</h3>
                  <p>{contact.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ivory">Phone & WhatsApp</h3>
                  <p>
                    <a href={`tel:+${normalizeWhatsAppNumber(contact.phone)}`} className="hover:text-ivory">
                      {formatPhoneDisplay(contact.phone)}
                    </a>
                  </p>
                  {contact.alt_phone && (
                    <p className="text-stone/70">
                      Alternate:{' '}
                      <a href={`tel:+${normalizeWhatsAppNumber(contact.alt_phone)}`} className="hover:text-ivory">
                        {formatPhoneDisplay(contact.alt_phone)}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ivory">Email</h3>
                  <p>
                    <a href={`mailto:${contact.email}`} className="hover:text-ivory">
                      {contact.email}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gold-light flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ivory">Opening Hours</h3>
                  <p>{contact.hours}</p>
                  <p className="text-stone/70">Sundays: by appointment only</p>
                </div>
              </div>
            </address>

            <div className="pt-4 border-t border-navy-2">
              <a
                href={whatsappUrl(contact.whatsapp, 'Hello A-Plus Fashion, I have an inquiry.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs rounded transition flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-stone shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-navy mb-4 border-b border-stone pb-2">Send us a message</h2>

            {sent ? (
              <div className="p-6 bg-emerald-50 rounded border border-emerald-200 text-center space-y-3" role="status">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-aplus-success flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg text-navy">Message received</h3>
                <p className="text-xs text-text-2">Thank you, {name}. We will reply by email or WhatsApp within a few hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
                <div>
                  <label htmlFor="c-name" className="block font-medium text-navy mb-1">Full name *</label>
                  <input id="c-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kolawole Adebayo" className={inputClass} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-email" className="block font-medium text-navy mb-1">Email *</label>
                    <input id="c-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className="block font-medium text-navy mb-1">Phone / WhatsApp</label>
                    <input id="c-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 803 123 4567" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="c-message" className="block font-medium text-navy mb-1">Your message *</label>
                  <textarea id="c-message" required rows={5} minLength={10} maxLength={3000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what you would like to know…" className="w-full px-3 py-2.5 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy" />
                </div>

                {/* Honeypot — hidden from humans, filled by bots */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="c-website">Website</label>
                  <input id="c-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                {errorMsg && (
                  <p role="alert" className="p-3 bg-red-50 text-aplus-error rounded border border-red-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="px-8 py-3.5 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory font-semibold rounded transition flex items-center space-x-2 min-h-[44px]"
                >
                  <span>{isSubmitting ? 'Sending…' : 'Send message'}</span>
                  <ArrowRight className="w-4 h-4 text-gold-light" aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
