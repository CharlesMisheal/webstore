'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Truck, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useStoreSettings } from '@/components/providers/StoreSettingsProvider';
import { formatPhoneDisplay, normalizeWhatsAppNumber, whatsappUrl } from '@/lib/whatsapp';
import type { Category } from '@/lib/types';

interface FooterProps {
  categories: Category[];
}

export function Footer({ categories }: FooterProps) {
  const { contact, social } = useStoreSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-ivory border-t-2 border-gold pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Strips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-navy-2">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-navy-2 text-gold-light rounded-md border border-gold/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-ivory">Handcrafted Distinction</h4>
              <p className="text-xs text-stone mt-1 leading-relaxed">
                Precision-cut bespoke suits and tailored blazers made with premium fabrics by master tailors in Ijebu-Ode.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-navy-2 text-gold-light rounded-md border border-gold/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-ivory">Secured with Paystack</h4>
              <p className="text-xs text-stone mt-1 leading-relaxed">
                Bank-grade 256-bit encryption. Pay via debit card, direct bank transfer, or USSD with instant verification.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-navy-2 text-gold-light rounded-md border border-gold/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-ivory">Nigeria & Global Dispatch</h4>
              <p className="text-xs text-stone mt-1 leading-relaxed">
                Fast courier delivery across Lagos, Ogun, Abuja, and nationwide. DHL express worldwide delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12 border-b border-navy-2">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-widest text-ivory uppercase">
                A-Plus
              </span>
              <span className="text-xs tracking-[0.3em] text-gold-light uppercase">
                Fashion Home
              </span>
            </div>
            <p className="font-serif italic text-gold-light text-base">
              Dress the Best Version of You.
            </p>
            <p className="text-xs text-stone leading-relaxed max-w-sm">
              Tailoring confidence and sartorial distinction for grooms, wedding parties, executives, and clients across the globe.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gold-light">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Instagram
                </a>
              )}
              <span aria-hidden="true">•</span>
              <a
                href={social.whatsapp_channel || whatsappUrl(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                WhatsApp
              </a>
              {social.facebook && (
                <>
                  <span aria-hidden="true">•</span>
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Facebook
                  </a>
                </>
              )}
              {social.tiktok && (
                <>
                  <span aria-hidden="true">•</span>
                  <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    TikTok
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-gold-light">
              The Collection
            </h5>
            <ul className="space-y-2 text-xs text-stone">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="hover:text-ivory transition">{c.name}</Link>
                </li>
              ))}
              <li><Link href="/shop" className="hover:text-ivory transition font-medium text-gold-light">View Full Catalog</Link></li>
            </ul>
          </div>

          {/* Bespoke Services */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-gold-light">
              Services & Care
            </h5>
            <ul className="space-y-2 text-xs text-stone">
              <li><Link href="/quote" className="hover:text-ivory transition">Request Bespoke Quote</Link></li>
              <li><Link href="/booking" className="hover:text-ivory transition">Book Fitting Consultation</Link></li>
              <li><Link href="/size-guide" className="hover:text-ivory transition">Size Guide & Measuring</Link></li>
              <li><Link href="/return-policy" className="hover:text-ivory transition">Alteration & Returns Policy</Link></li>
              <li><Link href="/track" className="hover:text-ivory transition">Track Your Order</Link></li>
              <li><Link href="/reviews" className="hover:text-ivory transition">Customer Testimonials</Link></li>
            </ul>
          </div>

          {/* Workshop Contact */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-gold-light">
              Ijebu-Ode Workshop
            </h5>
            <div className="space-y-2.5 text-xs text-stone">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gold-light flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{contact.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gold-light flex-shrink-0" aria-hidden="true" />
                <a href={`tel:+${normalizeWhatsAppNumber(contact.phone)}`} className="hover:text-ivory">
                  {formatPhoneDisplay(contact.phone)}
                </a>
              </div>
              {contact.alt_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gold-light flex-shrink-0" aria-hidden="true" />
                  <a href={`tel:+${normalizeWhatsAppNumber(contact.alt_phone)}`} className="hover:text-ivory">
                    {formatPhoneDisplay(contact.alt_phone)}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gold-light flex-shrink-0" aria-hidden="true" />
                <a href={`mailto:${contact.email}`} className="hover:text-ivory">{contact.email}</a>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gold-light flex-shrink-0" aria-hidden="true" />
                <span>{contact.hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone/80 space-y-4 sm:space-y-0">
          <p>© {year} A-Plus Fashion Home. All rights reserved. Ijebu-Ode, Nigeria.</p>
          <div className="flex items-center space-x-6">
            <Link href="/return-policy" className="hover:text-ivory transition">Alteration Policy</Link>
            <Link href="/size-guide" className="hover:text-ivory transition">Size Guide</Link>
            <Link href="/admin/login" className="text-gold-light hover:underline font-medium">Owner Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
