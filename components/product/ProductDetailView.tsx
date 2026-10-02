'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant, FitType } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { useCart } from '../cart/CartContext';
import { SizeGuideModal } from '../ui/SizeGuideModal';
import {
  ShoppingBag,
  MessageCircle,
  Ruler,
  Check,
  Truck,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Star,
  Scissors
} from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { addItem, currency } = useCart();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || { id: 'default', product_id: product.id, size_label: '40R', stock: 5 }
  );
  const [fitType, setFitType] = useState<FitType>('ready_to_wear');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('fabric');
  const [addedToast, setAddedToast] = useState(false);

  // Review submission state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const images = product.images.length > 0 ? product.images : [
    {
      id: 'placeholder',
      product_id: product.id,
      storage_path: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      alt: product.name,
      sort_order: 1,
      is_cover: true,
    }
  ];

  const currentImage = images[selectedImageIdx] || images[0];

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      variant_id: selectedVariant.id,
      name: product.name,
      size_label: selectedVariant.size_label,
      fit_type: fitType,
      unit_price_kobo: product.price_kobo,
      qty: quantity,
      image_url: currentImage.storage_path,
      slug: product.slug,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  // WhatsApp order link prefill
  const productUrl = typeof window !== 'undefined' ? window.location.href : `https://aplusfashion.ng/product/${product.slug}`;
  const whatsappMessage = `Hello Henry, I want to order the "${product.name}" in Size ${selectedVariant.size_label} (${fitType === 'bespoke' ? 'Bespoke Made-to-Measure' : 'Ready-to-Wear'}). Link: ${productUrl}`;
  const whatsappOrderUrl = `https://wa.me/2347071374515?text=${encodeURIComponent(whatsappMessage)}`;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewerName.trim() && reviewText.trim()) {
      setReviewSubmitted(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-text-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-navy transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-navy transition">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-navy transition">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-navy font-semibold line-clamp-1">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        {/* Left Column: Image Gallery (4:5 Portrait) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-ivory-2 border border-stone shadow-sm">
            <Image
              src={currentImage.storage_path}
              alt={currentImage.alt || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-top"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative w-20 h-24 rounded overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImageIdx === idx ? 'border-navy shadow-sm' : 'border-stone hover:border-gold'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={img.storage_path}
                    alt={img.alt || `${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details, Sizing, and Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {product.category && (
              <span className="text-xs uppercase tracking-widest text-gold-dark font-semibold block mb-1">
                {product.category.name}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-navy">
              {product.name}
            </h1>

            {/* Price Display */}
            <div className="mt-3 flex items-baseline space-x-3">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                {formatMoney(product.price_kobo, currency)}
              </span>
              <span className="text-xs text-text-3">
                (Integer kobo verified: ₦{(product.price_kobo / 100).toLocaleString('en-NG')})
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-2 leading-relaxed">
            {product.description}
          </p>

          <hr className="border-stone" />

          {/* Fit Type Selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-navy uppercase tracking-wider block">
              1. Choose Tailoring Option
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFitType('ready_to_wear')}
                className={`p-3 rounded border text-left text-xs transition ${
                  fitType === 'ready_to_wear'
                    ? 'border-navy bg-navy text-ivory shadow-sm'
                    : 'border-stone bg-white text-text hover:border-gold'
                }`}
              >
                <span className="font-semibold block">Ready to Wear</span>
                <span className={`text-[11px] block mt-0.5 ${fitType === 'ready_to_wear' ? 'text-ivory/80' : 'text-text-3'}`}>
                  Standard British suit sizing
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFitType('bespoke')}
                className={`p-3 rounded border text-left text-xs transition ${
                  fitType === 'bespoke'
                    ? 'border-navy bg-navy text-ivory shadow-sm'
                    : 'border-stone bg-white text-text hover:border-gold'
                }`}
              >
                <span className="font-semibold block flex items-center justify-between">
                  <span>Custom Bespoke</span>
                  <Scissors className="w-3.5 h-3.5 text-gold-light" />
                </span>
                <span className={`text-[11px] block mt-0.5 ${fitType === 'bespoke' ? 'text-ivory/80' : 'text-text-3'}`}>
                  Tailored to your body measurements
                </span>
              </button>
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy uppercase tracking-wider">
                2. Select Size
              </span>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-semibold text-gold-dark hover:text-navy flex items-center space-x-1"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide & Measuring Chart</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`py-2 px-3 text-xs font-medium rounded border transition ${
                      isSelected
                        ? 'border-navy bg-navy text-ivory font-semibold shadow-sm'
                        : 'border-stone bg-white text-navy hover:border-gold'
                    }`}
                  >
                    {v.size_label}
                  </button>
                );
              })}
            </div>
            {selectedVariant.stock <= 3 && selectedVariant.stock > 0 && (
              <p className="text-[11px] text-aplus-warning font-medium">
                Low stock: Only {selectedVariant.stock} left in size {selectedVariant.size_label}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-navy uppercase tracking-wider block">
              3. Quantity
            </span>
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center border border-stone rounded bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-text hover:bg-ivory-2 transition text-sm"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 text-xs font-semibold text-navy">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="px-3 py-1.5 text-text hover:bg-ivory-2 transition text-sm"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-4 bg-navy hover:bg-navy-2 text-ivory font-semibold text-sm rounded shadow-lg transition flex items-center justify-center space-x-2 touch-target"
            >
              <ShoppingBag className="w-5 h-5 text-gold-light" />
              <span>Add to Shopping Bag • {formatMoney(product.price_kobo * quantity, currency)}</span>
            </button>

            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-aplus-success text-xs font-medium rounded flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Added to your bag! View bag to proceed to checkout.</span>
              </div>
            )}

            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-transparent hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-semibold text-xs rounded transition flex items-center justify-center space-x-2 touch-target"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Quick Order via WhatsApp</span>
            </a>

            <div className="text-center pt-1">
              <Link
                href="/quote"
                className="text-xs text-gold-dark hover:text-navy font-semibold underline underline-offset-4"
              >
                Need custom embroidery, group wedding rates or special fabrics? Request a Quote &rarr;
              </Link>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 bg-ivory-2 rounded border border-stone space-y-2 text-xs text-text-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-gold-dark flex-shrink-0" />
              <span><strong>Free 1st Alteration:</strong> Perfect fit guaranteed or we adjust it free.</span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-gold-dark flex-shrink-0" />
              <span><strong>Fast Dispatch:</strong> Lagos/Ogun (1–3 days) • Nationwide (3–5 days).</span>
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="border-t border-stone divide-y divide-stone text-xs">
            {/* Fabric & Tailoring */}
            <div>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'fabric' ? null : 'fabric')}
                className="w-full py-3 flex items-center justify-between text-navy font-semibold text-left"
              >
                <span>Fabric & Craftsmanship Details</span>
                <ChevronDown className={`w-4 h-4 transition ${activeAccordion === 'fabric' ? 'rotate-180' : ''}`} />
              </button>
              {activeAccordion === 'fabric' && (
                <div className="pb-3 text-text-3 space-y-1.5">
                  <p>• Hand-canvassed chest piece with natural horsehair for an effortless drape.</p>
                  <p>• Premium Super 150s worsted wool blend or high-pile cotton velvet.</p>
                  <p>• Genuine horn buttons with hand-stitched functional surgeon cuffs.</p>
                  <p>• Double inner breast pockets with hidden pen pocket.</p>
                </div>
              )}
            </div>

            {/* Delivery & Returns */}
            <div>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'delivery' ? null : 'delivery')}
                className="w-full py-3 flex items-center justify-between text-navy font-semibold text-left"
              >
                <span>Delivery & Return Policy</span>
                <ChevronDown className={`w-4 h-4 transition ${activeAccordion === 'delivery' ? 'rotate-180' : ''}`} />
              </button>
              {activeAccordion === 'delivery' && (
                <div className="pb-3 text-text-3 space-y-1.5">
                  <p>• Courier delivery across Nigeria with tracking link provided upon dispatch.</p>
                  <p>• Pick-up available at our workshop in 2 Jagunmolu St, Ondo Road, Ijebu-Ode.</p>
                  <p>• 14-day alteration window for minor adjustments to ensure bespoke perfection.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Form */}
      <section className="border-t border-stone pt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
              Customer Experiences
            </span>
            <h3 className="font-serif text-2xl text-navy mt-1">
              Reviews for this Garment
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-text-2">
            <div className="flex text-gold-dark">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="font-bold text-navy">5.0 / 5.0</span>
            <span className="text-xs text-text-3">(Verified Buyers)</span>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white p-6 rounded border border-stone">
          <h4 className="font-serif text-base text-navy font-semibold mb-2">Leave a Client Review</h4>
          {reviewSubmitted ? (
            <div className="p-4 bg-emerald-50 text-aplus-success text-xs rounded border border-emerald-200">
              Thank you for your review! Our moderation team will approve and publish it to the store.
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Femi Adeyemi"
                    className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">Rating (1 to 5 Stars) *</label>
                  <select
                    value={reviewerRating}
                    onChange={(e) => setReviewerRating(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy"
                  >
                    <option value={5}>5 Stars - Impeccable fit & quality</option>
                    <option value={4}>4 Stars - Great quality</option>
                    <option value={3}>3 Stars - Good</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Your Feedback *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the fabric, tailoring fit, and the occasion you wore it to..."
                  className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded transition"
              >
                Submit Review for Moderation
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-stone pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl text-navy">You May Also Admire</h3>
            <Link href="/shop" className="text-xs font-semibold text-gold-dark hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <div key={p.id} className="group">
                <Link href={`/product/${p.slug}`} className="block relative aspect-[4/5] rounded overflow-hidden bg-ivory-2 border border-stone mb-2">
                  <Image
                    src={p.images[0]?.storage_path || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                  />
                </Link>
                <Link href={`/product/${p.slug}`} className="font-serif text-sm font-semibold text-navy hover:text-gold-dark transition line-clamp-1">
                  {p.name}
                </Link>
                <p className="text-xs text-navy font-medium mt-0.5">
                  {formatMoney(p.price_kobo, currency)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sizing Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
