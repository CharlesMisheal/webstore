import React from 'react';
import Link from 'next/link';
import { getReviews, getProducts } from '@/lib/db';
import { Star, CheckCircle2, ShieldCheck, Scissors } from 'lucide-react';

export default async function ReviewsPage() {
  const [reviews, products] = await Promise.all([
    getReviews(undefined, true),
    getProducts(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold">
          Customer Experiences
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy">
          Client Testimonials & Reviews
        </h1>
        <p className="text-xs sm:text-sm text-text-2 max-w-xl mx-auto">
          Read genuine feedback from executives, grooms, and wedding parties dressed by A-Plus Fashion Home across Nigeria, the UK, and beyond.
        </p>

        {/* Rating Score Card */}
        <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white border border-stone rounded-full shadow-sm mt-3">
          <div className="flex text-gold-dark">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <span className="font-serif text-lg font-bold text-navy">5.0 / 5.0</span>
          <span className="text-xs text-text-3">• 100% Recommended</span>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-white p-6 rounded-lg border border-stone shadow-subtle flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex text-gold-dark">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-[10px] text-text-3">
                  {new Date(rev.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                </span>
              </div>
              {rev.product_name && (
                <p className="text-xs font-semibold text-gold-dark mt-2">
                  Garment: {rev.product_name}
                </p>
              )}
              <p className="text-xs sm:text-sm text-text-2 mt-2 leading-relaxed italic">
                &ldquo;{rev.body}&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-stone flex items-center justify-between">
              <div>
                <h4 className="font-serif font-semibold text-navy text-xs sm:text-sm">{rev.author_name}</h4>
                <p className="text-[11px] text-text-3">{rev.author_location || 'Nigeria'}</p>
              </div>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-aplus-success border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Client</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Quote Banner */}
      <div className="bg-navy text-ivory p-8 rounded-lg border border-gold flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-serif text-xl text-ivory">Ready to Experience Sartorial Distinction?</h3>
          <p className="text-xs text-stone">Shop our ready-to-wear collection or request custom bespoke measurements.</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/shop"
            className="px-5 py-2.5 bg-gold hover:bg-gold-light text-navy text-xs font-semibold rounded shadow transition"
          >
            Shop Suits
          </Link>
          <Link
            href="/quote"
            className="px-5 py-2.5 bg-transparent hover:bg-navy-2 border border-gold/40 text-ivory text-xs font-semibold rounded transition"
          >
            Request Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
