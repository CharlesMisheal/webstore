import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Scissors, Award, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { getStoreSettings } from '@/lib/db';

/** Only these tags survive from the owner-edited story HTML. */
function sanitizeStoryHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/<(?!\/?(p|strong|em|br|ul|ol|li)\b)[^>]*>/gi, '');
}

export default async function AboutPage() {
  const { about, contact } = await getStoreSettings();
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="bg-navy text-ivory py-16 sm:py-24 border-b-2 border-gold relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-widest text-gold-light font-semibold">
            Our Heritage & Story
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-ivory">
            {about.headline}
          </h1>
          <p className="font-serif italic text-gold-light text-lg">
            &ldquo;Dress the Best Version of You.&rdquo;
          </p>
          <div
            className="text-stone text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto space-y-2 [&_strong]:text-ivory"
            dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(about.story_html) }}
          />
          <p className="text-gold-light text-xs uppercase tracking-widest pt-2">
            {about.years}+ years · {about.product_count} garments · {about.happy_clients} clients
          </p>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg border border-stone shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-ivory-2 text-gold-dark flex items-center justify-center border border-stone">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-navy">Master Pattern Drafting</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Every bespoke garment begins with an individual paper pattern drafted from scratch, accounting for unique posture, shoulder slope, and natural waist contours.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-stone shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-ivory-2 text-gold-dark flex items-center justify-center border border-stone">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-navy">Super 150s & Pure Velvet</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              We source directly from premium mills: fine worsted wools, rich plush velvets, and 100% Egyptian long-staple cottons that breathe naturally in Nigerian climates.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-stone shadow-subtle space-y-3">
            <div className="w-12 h-12 rounded-full bg-ivory-2 text-gold-dark flex items-center justify-center border border-stone">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-navy">{about.happy_clients} Discerning Clients</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              From high-profile weddings in Lagos and Abuja to clients ordering bespoke suits in London and North America, our precision fit speaks for itself.
            </p>
          </div>
        </div>
      </section>

      {/* Workshop Location */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-ivory-2 p-8 sm:p-12 rounded-lg border border-stone grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
              The Ijebu-Ode Atelier
            </span>
            <h2 className="font-serif text-3xl text-navy">
              Where Precision Meets Passion
            </h2>
            <p className="text-xs sm:text-sm text-text-2 leading-relaxed">
              Located at <strong>{contact.address}</strong>, our workshop houses cutting tables, hand-finishing stations, and a dedicated fitting salon. We welcome clients for in-person consultations by appointment.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="px-6 py-3 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded shadow transition"
              >
                Schedule an Atelier Visit
              </Link>
              <Link
                href="/quote"
                className="px-6 py-3 bg-transparent hover:bg-white text-navy border border-stone text-xs font-semibold rounded transition"
              >
                Request Bespoke Quote
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-stone shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80"
              alt="A-Plus Tailoring Workshop"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
