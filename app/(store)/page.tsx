import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCategories, getProducts, getReviews, getStoreSettings } from '@/lib/db';
import { formatPhoneDisplay, whatsappUrl } from '@/lib/whatsapp';
import { ProductCard } from '@/components/product/ProductCard';
import { ArrowRight, Sparkles, ShieldCheck, Truck, MessageCircle, Star, Scissors, CheckCircle, Calendar } from 'lucide-react';

export default async function HomePage() {
  const [categories, featuredProducts, reviews, settings] = await Promise.all([
    getCategories(),
    getProducts({ featuredOnly: true }),
    getReviews(undefined, true),
    getStoreSettings(),
  ]);
  const { contact } = settings;

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-navy text-ivory overflow-hidden min-h-[580px] lg:min-h-[640px] flex items-center border-b-2 border-gold">
        {/* Background Image with High Quality Sartorial Texture */}
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-luminosity">
          <Image
            src="/images/feature-suit-ivory.jpg"
            alt="A-Plus Tailored Suit Background"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Gradient Overlay for WCAG AA Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/60 z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-24">
          <div className="max-w-2xl space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded bg-navy-2/90 border border-gold/40 text-gold-light text-[10px] sm:text-xs tracking-wider uppercase shadow-lg">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full border border-gold/50 bg-ivory/10 shrink-0">
                <Image src="/images/logo.png" alt="A-Plus Fashion Home logo" fill className="object-cover" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
                <span className="truncate">A-Plus Fashion Home · Ijebu-Ode, Nigeria</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-ivory tracking-tight leading-tight">
              Wear Class, <br />
              <span className="italic text-gold-light">Live Bold.</span>
            </h1>

            <p className="text-stone text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl">
              Tailored suits, tuxedos and blazers made to fit you — ready to wear or made to measure with precision craftsmanship.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                href="/shop"
                className="px-8 py-4 bg-gold hover:bg-gold-light text-navy font-semibold text-sm rounded shadow-lg transition flex items-center justify-center space-x-2 touch-target"
              >
                <span>Shop the Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/quote"
                className="px-8 py-4 bg-transparent hover:bg-navy-2 text-ivory font-semibold text-sm rounded border border-gold/60 transition flex items-center justify-center space-x-2 touch-target"
              >
                <span>Request a Quote</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST ELEMENTS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-20">
        <div className="bg-white rounded-lg shadow-card border border-stone p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-3">
            <div className="p-2.5 bg-ivory-2 text-gold-dark rounded-full border border-stone">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Free Fitting Advice</h4>
              <p className="text-xs text-text-3 mt-0.5">In our shop or via live video</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-3">
            <div className="p-2.5 bg-ivory-2 text-gold-dark rounded-full border border-stone">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Paystack Verified</h4>
              <p className="text-xs text-text-3 mt-0.5">Card, USSD & Bank Transfer</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-3">
            <div className="p-2.5 bg-ivory-2 text-gold-dark rounded-full border border-stone">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Reliable Dispatch</h4>
              <p className="text-xs text-text-3 mt-0.5">Across Nigeria & Worldwide DHL</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-3">
            <div className="p-2.5 bg-ivory-2 text-gold-dark rounded-full border border-stone">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Direct WhatsApp</h4>
              <p className="text-xs text-text-3 mt-0.5">{formatPhoneDisplay(contact.whatsapp)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED LOOKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="relative overflow-hidden rounded-2xl border border-stone bg-white shadow-card min-h-[440px]">
            <Image
              src="/images/feature-suit-purple.jpg"
              alt="Purple bespoke suit editorial"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120d1f]/90 via-[#120d1f]/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f4d06b]">Signature Look</span>
              <h3 className="mt-2 font-serif text-2xl sm:text-3xl text-white">Royal purple, tailored for presence.</h3>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-stone bg-white shadow-card min-h-[210px]">
              <Image
                src="/images/feature-suit-ivory.jpg"
                alt="Ivory bespoke suit editorial"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120d1f]/80 via-[#120d1f]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f4d06b]">Modern Classic</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gold/40 bg-navy-2 p-6 shadow-card text-ivory">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light">Made for occasions</span>
              <h3 className="mt-3 font-serif text-2xl text-ivory">Crafted in Ijebu-Ode for weddings, galas, and milestone moments.</h3>
              <Link href="/quote" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-light hover:text-gold">
                Request a quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-3 border-b border-stone">
          <div>
            <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
              Curated Wardrobe
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-navy mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-gold-dark hover:text-navy hover:underline transition mt-2 md:mt-0"
          >
            Explore All Categories &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative rounded-lg overflow-hidden border border-stone bg-white shadow-subtle hover:shadow-card transition flex flex-col"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ivory-2">
                <Image
                  src={cat.image_path || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80'}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120d1f]/85 via-[#120d1f]/25 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]">
                  <h3 className="font-serif text-base font-semibold text-white">{cat.name}</h3>
                  <span className="text-[11px] text-[#f4d06b] group-hover:underline">Shop Now &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-3 border-b border-stone">
          <div>
            <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
              Signature Creations
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-navy mt-1">
              Featured Formal Wear
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-gold-dark hover:text-navy hover:underline transition mt-2 md:mt-0"
          >
            View Complete Collection &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. BESPOKE SERVICE HERO BAND */}
      <section className="bg-navy-2 text-ivory py-16 border-y-2 border-gold/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold-light">
                Tailored Made-To-Measure
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-ivory">
                Your Suit, Your Story.
              </h2>
              <p className="text-stone text-sm sm:text-base leading-relaxed max-w-xl">
                Tell us the occasion, fabric preference, and your budget. We will send a quotation within 24 hours and schedule your fitting consultation — in our Ijebu-Ode workshop or via video.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/quote"
                  className="px-6 py-3.5 bg-gold hover:bg-gold-light text-navy font-semibold text-sm rounded transition shadow touch-target flex items-center space-x-2"
                >
                  <span>Request a Quotation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/booking"
                  className="px-6 py-3.5 bg-transparent hover:bg-navy text-ivory border border-gold/60 font-semibold text-sm rounded transition touch-target flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4 text-gold-light" />
                  <span>Book Fitting Session</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-navy p-6 rounded-lg border border-gold/30 space-y-4">
              <h4 className="font-serif text-lg text-gold-light">How Bespoke Works</h4>
              <ol className="space-y-3 text-xs text-stone">
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold-light flex items-center justify-center font-bold flex-shrink-0">1</span>
                  <span><strong>Submit Specs & Photos:</strong> Share garment style, wedding theme, and target dates.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold-light flex items-center justify-center font-bold flex-shrink-0">2</span>
                  <span><strong>24-Hour Quotation:</strong> Henry reviews your requirements and provides an exact price quote.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold-light flex items-center justify-center font-bold flex-shrink-0">3</span>
                  <span><strong>Fitting & Delivery:</strong> We take your measurements, tailor with precision, and dispatch nationwide.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY A-PLUS FASHION HOME */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest">
            Uncompromising Standards
          </span>
          <h2 className="font-serif text-3xl text-navy mt-1">
            Why Discerning Gentlemen Choose A-Plus
          </h2>
          <p className="text-text-2 text-xs sm:text-sm mt-2">
            Every garment leaving our Ijebu-Ode workshop carries the hallmark of meticulous Nigerian tailoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded border border-stone shadow-subtle text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-ivory-2 border border-stone flex items-center justify-center text-gold-dark">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-semibold text-navy">Hand-Finished Tailoring</h3>
            <p className="text-xs text-text-3">Hand-sewn lapels, precision buttonholes, and structured canvassing that molds to your body.</p>
          </div>

          <div className="bg-white p-6 rounded border border-stone shadow-subtle text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-ivory-2 border border-stone flex items-center justify-center text-gold-dark">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-semibold text-navy">Premium Fabrics</h3>
            <p className="text-xs text-text-3">Imported Super 150s wool blends, pure velvet, and breathable Egyptian cotton.</p>
          </div>

          <div className="bg-white p-6 rounded border border-stone shadow-subtle text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-ivory-2 border border-stone flex items-center justify-center text-gold-dark">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-semibold text-navy">Free 1st Alteration</h3>
            <p className="text-xs text-text-3">If the fit isn’t 100% sharp upon delivery, we will adjust it for you free of charge.</p>
          </div>

          <div className="bg-white p-6 rounded border border-stone shadow-subtle text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-ivory-2 border border-stone flex items-center justify-center text-gold-dark">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-semibold text-navy">Trusted for Weddings</h3>
            <p className="text-xs text-text-3">Over 1,200 grooms, groomsmen, and corporate leaders dressed across Nigeria and the UK.</p>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section className="bg-ivory-2 py-16 border-y border-stone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-3 border-b border-stone">
            <div>
              <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
                Verified Feedback
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-navy mt-1">
                Words from Our Clients
              </h2>
            </div>
            <Link
              href="/reviews"
              className="text-xs font-semibold text-gold-dark hover:text-navy hover:underline transition mt-2 md:mt-0"
            >
              Read All Testimonials &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((rev) => (
              <div key={rev.id} className="bg-white p-6 rounded border border-stone shadow-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1 text-gold-dark mb-3">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-text-2 italic leading-relaxed">
                    &ldquo;{rev.body}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-navy text-xs">{rev.author_name}</h5>
                    <span className="text-[11px] text-text-3">{rev.author_location}</span>
                  </div>
                  <span className="text-[10px] bg-ivory-2 text-aplus-success font-semibold px-2 py-0.5 rounded border border-stone">
                    Verified Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. VISIT US IN IJEBU-ODE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy text-ivory rounded-lg overflow-hidden border border-gold p-8 sm:p-12">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-gold-light font-semibold">
              Visit Our Tailoring Atelier
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-ivory">
              Experience Bespoke Tailoring in Person
            </h2>
            <p className="text-stone text-sm leading-relaxed">
              Step into our Ijebu-Ode atelier to touch premium fabric swatches, review sample lapels, and have your measurements taken personally by master tailor Henry Abraham.
            </p>

            <div className="pt-2 text-xs space-y-2 text-stone">
              <p>📍 <strong>Address:</strong> {contact.address}</p>
              <p>🕒 <strong>Hours:</strong> {contact.hours}</p>
              <p>💬 <strong>Direct WhatsApp:</strong> {formatPhoneDisplay(contact.whatsapp)}</p>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="px-6 py-3 bg-gold hover:bg-gold-light text-navy font-semibold text-xs rounded transition shadow"
              >
                Book Your Shop Appointment
              </Link>
              <a
                href={whatsappUrl(contact.whatsapp, 'Hello Henry, I would like to visit the Ijebu-Ode workshop.')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-navy-2 hover:bg-navy text-gold-light border border-gold/40 font-semibold text-xs rounded transition flex items-center space-x-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Message on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
