import React from 'react';
import Link from 'next/link';
import { Ruler, CheckCircle2, Scissors, Calendar } from 'lucide-react';

export default function SizeGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Sartorial Precision
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Master Tailoring Size Guide
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-xl mx-auto">
          At A-Plus Fashion Home, our garments follow classic British tailoring proportions with ergonomic room for Nigerian physiques. Follow our chart or book a fitting consultation.
        </p>
      </div>

      {/* Suits & Tuxedos Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-lg border border-stone shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-stone pb-3">
          <Ruler className="w-5 h-5 text-gold-dark" />
          <h2 className="font-serif text-xl font-semibold text-navy">Suits, Blazers & Tuxedos Size Chart</h2>
        </div>
        <p className="text-xs text-text-3">
          Measurements are given in inches (&quot;). Regular (R) fits men between 5&apos;8&quot; and 6&apos;1&quot;.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                <th className="p-3">UK/US Size</th>
                <th className="p-3">Euro Size</th>
                <th className="p-3">To Fit Chest</th>
                <th className="p-3">Shoulder Width</th>
                <th className="p-3">Trouser Waist</th>
                <th className="p-3">Sleeve Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              <tr>
                <td className="p-3 font-bold text-navy">38R</td>
                <td className="p-3">48</td>
                <td className="p-3">38&quot; (96 cm)</td>
                <td className="p-3">17.5&quot;</td>
                <td className="p-3">32&quot;</td>
                <td className="p-3">24.5&quot;</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-navy">40R</td>
                <td className="p-3">50</td>
                <td className="p-3">40&quot; (102 cm)</td>
                <td className="p-3">18.2&quot;</td>
                <td className="p-3">34&quot;</td>
                <td className="p-3">25.0&quot;</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-navy">42R</td>
                <td className="p-3">52</td>
                <td className="p-3">42&quot; (107 cm)</td>
                <td className="p-3">19.0&quot;</td>
                <td className="p-3">36&quot;</td>
                <td className="p-3">25.5&quot;</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-navy">44R</td>
                <td className="p-3">54</td>
                <td className="p-3">44&quot; (112 cm)</td>
                <td className="p-3">19.7&quot;</td>
                <td className="p-3">38&quot;</td>
                <td className="p-3">26.0&quot;</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-navy">46R</td>
                <td className="p-3">56</td>
                <td className="p-3">46&quot; (117 cm)</td>
                <td className="p-3">20.5&quot;</td>
                <td className="p-3">40&quot;</td>
                <td className="p-3">26.5&quot;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Measure Step-by-Step */}
      <div className="bg-ivory-2 p-6 sm:p-8 rounded-lg border border-stone space-y-6">
        <h2 className="font-serif text-xl font-semibold text-navy border-b border-stone pb-3">
          How to Take Your Measurements at Home
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-2">
          <div className="bg-white p-5 rounded border border-stone space-y-2">
            <h3 className="font-bold text-navy text-sm">1. Chest Measurement</h3>
            <p>Stand up straight with your arms relaxed by your sides. Wrap the soft measuring tape around the fullest part of your chest, directly under your armpits and across your shoulder blades.</p>
          </div>
          <div className="bg-white p-5 rounded border border-stone space-y-2">
            <h3 className="font-bold text-navy text-sm">2. Trouser Waist</h3>
            <p>Measure around where you prefer your formal trousers to sit — typically 1 inch below your navel. Keep one finger between your abdomen and the tape so it sits comfortably without pinching.</p>
          </div>
          <div className="bg-white p-5 rounded border border-stone space-y-2">
            <h3 className="font-bold text-navy text-sm">3. Shoulder Breadth</h3>
            <p>Measure across the curve of your upper back from the tip of the left shoulder bone to the tip of the right shoulder bone where the sleeve seam should naturally fall.</p>
          </div>
          <div className="bg-white p-5 rounded border border-stone space-y-2">
            <h3 className="font-bold text-navy text-sm">4. Trouser Inseam</h3>
            <p>Measure from the highest point of the inner crotch seam straight down the inside of your leg to the top of your formal shoe sole.</p>
          </div>
        </div>
      </div>

      {/* Bespoke Fitting CTA */}
      <div className="bg-navy text-ivory p-8 rounded-lg border border-gold flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-serif text-xl text-ivory">Want an Expert to Guide You?</h3>
          <p className="text-xs text-stone">Book a 15-minute live WhatsApp video consultation or visit our Ijebu-Ode workshop.</p>
        </div>
        <Link
          href="/booking"
          className="px-6 py-3 bg-gold hover:bg-gold-light text-navy text-xs font-semibold rounded shadow transition flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Fitting Session</span>
        </Link>
      </div>
    </div>
  );
}
