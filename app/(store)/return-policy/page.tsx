import React from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Scissors, MessageCircle } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Customer Confidence
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Alterations & Returns Policy
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-lg mx-auto">
          At A-Plus Fashion Home, our highest priority is your supreme comfort and fit. We stand behind every stitch tailored in our Ijebu-Ode workshop.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-lg border border-stone shadow-sm space-y-8 text-xs text-text-2 leading-relaxed">
        {/* Section 1: Free 1st Alteration */}
        <section className="space-y-2">
          <div className="flex items-center space-x-2 text-navy">
            <Scissors className="w-5 h-5 text-gold-dark" />
            <h2 className="font-serif text-lg font-semibold">1. Free First Alteration Guarantee</h2>
          </div>
          <p>
            For all bespoke and made-to-measure suits, tuxedos, and tailored trousers, we provide <strong>one complimentary alteration</strong> within <strong>14 days of delivery</strong>. If your waist needs taking in, jacket sleeves adjusted, or trouser hem tapered, our tailors will refine it free of charge.
          </p>
        </section>

        {/* Section 2: Ready-to-Wear Exchanges */}
        <section className="space-y-2">
          <div className="flex items-center space-x-2 text-navy">
            <RefreshCw className="w-5 h-5 text-gold-dark" />
            <h2 className="font-serif text-lg font-semibold">2. Ready-to-Wear Size Exchanges</h2>
          </div>
          <p>
            Standard ready-to-wear items in unworn, unwashed condition with original tags attached can be exchanged for an alternative size within <strong>7 days</strong> of delivery. Return courier fees within Lagos & Ogun State are subsidized by A-Plus Fashion Home.
          </p>
        </section>

        {/* Section 3: Bespoke Custom Garments */}
        <section className="space-y-2">
          <div className="flex items-center space-x-2 text-navy">
            <ShieldCheck className="w-5 h-5 text-gold-dark" />
            <h2 className="font-serif text-lg font-semibold">3. Custom Made-to-Measure Garments</h2>
          </div>
          <p>
            Because bespoke garments are individually hand-cut to your specific body measurements and fabric choices, they cannot be returned for cash refunds. However, we guarantee that we will perform all necessary adjustments to ensure the fit meets your expectations.
          </p>
        </section>

        {/* Section 4: How to Initiate an Alteration */}
        <section className="bg-ivory-2 p-5 rounded border border-stone space-y-2">
          <h3 className="font-bold text-navy text-sm">How to Request an Alteration</h3>
          <p>
            1. Send a clear photo of you wearing the garment to master tailor Henry Abraham on WhatsApp at <strong>+234 707 137 4515</strong>.<br />
            2. We will analyze the fit, agree on the exact adjustments needed, and dispatch a courier or receive the garment at 2 Jagunmolu Street, Ondo Road, Ijebu-Ode.<br />
            3. Turnaround time for adjustments is typically 2–4 business days.
          </p>
        </section>
      </div>

      <div className="text-center">
        <a
          href="https://wa.me/2347071374515?text=Hello%20Henry%2C%20I%20have%20an%20alteration%20request%20for%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs rounded transition shadow"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Chat with Alterations Team on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
