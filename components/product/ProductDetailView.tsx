'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant, FitType, Review } from '@/lib/types';
import { useCart } from '../cart/CartContext';
import { useStoreSettings } from '../providers/StoreSettingsProvider';
import { whatsappUrl } from '@/lib/whatsapp';
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
  reviews?: Review[];
}

export function ProductDetailView({ product, relatedProducts, reviews = [] }: ProductDetailViewProps) {
  const { addItem, format } = useCart();
  const { contact, delivery_rules: deliveryRules } = useStoreSettings();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.find((v) => v.stock > 0) || product.variants[0] || null
  );
  const [fitType, setFitType] = useState<FitType>(product.variants.some((v) => v.stock > 0) || !product.is_bespoke ? 'ready_to_wear' : 'bespoke');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('fabric');
  const [addedToast, setAddedToast] = useState(false);
  const [addError, setAddError] = useState('');

  // Review submission state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerLocation, setReviewerLocation] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const outOfStock = fitType === 'ready_to_wear' && (!selectedVariant || selectedVariant.stock <= 0);
  const maxQty = fitType === 'ready_to_wear' && selectedVariant ? Math.max(1, Math.min(10, selectedVariant.stock)) : 10;

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
    setAddError('');
    if (!selectedVariant) {
      setAddError('Please select a size.');
      return;
    }
    if (outOfStock) {
      setAddError(`Size ${selectedVariant.size_label} is sold out ready-to-wear${product.is_bespoke ? ' — choose Custom Bespoke to have it made for you.' : '.'}`);
      return;
    }
    addItem({
      product_id: product.id,
      variant_id: selectedVariant.id,
      name: product.name,
      size_label: selectedVariant.size_label,
      fit_type: fitType,
      unit_price_kobo: product.price_kobo,
      qty: Math.min(quantity, maxQty),
      image_url: currentImage.storage_path,
      slug: product.slug,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  // WhatsApp order link prefill (number comes from store settings)
  const productPath = `/product/${product.slug}`;
  const whatsappMessage = `Hello Henry, I want to order the "${product.name}"${selectedVariant ? ` in size ${selectedVariant.size_label}` : ''} (${fitType === 'bespoke' ? 'Bespoke made-to-measure' : 'Ready to wear'}). Link: ${process.env.NEXT_PUBLIC_SITE_URL || ''}${productPath}`;
  const whatsappOrderUrl = whatsappUrl(contact.whatsapp, whatsappMessage);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          author_name: reviewerName,
          author_location: reviewerLocation,
          rating: reviewerRating,
          body: reviewText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReviewError(data.message || 'We could not submit your review. Please try again.');
        return;
      }
      setReviewSubmitted(true);
    } catch {
      setReviewError('Network error. Please try again.');
    } finally {
      setReviewSubmitting(false);
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
                {format(product.price_kobo)}
              </span>
              {product.is_bespoke && (
                <span className="text-xs text-text-3">Made-to-measure available</span>
              )}
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
                disabled={!product.is_bespoke}
                title={product.is_bespoke ? undefined : 'This piece is ready-to-wear only'}
                className={`p-3 rounded border text-left text-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
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

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Size">
              {product.variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const soldOut = fitType === 'ready_to_wear' && v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    className={`relative py-2 px-3 text-xs font-medium rounded border transition ${
                      isSelected
                        ? 'border-navy bg-navy text-ivory font-semibold shadow-sm'
                        : soldOut
                          ? 'border-stone bg-ivory-2 text-text-3 line-through'
                          : 'border-stone bg-white text-navy hover:border-gold'
                    }`}
                    title={soldOut ? 'Sold out ready-to-wear' : undefined}
                  >
                    {v.size_label}
                  </button>
                );
              })}
            </div>
            {product.variants.length === 0 && (
              <p className="text-[11px] text-text-3">Sizing is confirmed at your fitting — request a quote or order via WhatsApp.</p>
            )}
            {selectedVariant && fitType === 'ready_to_wear' && selectedVariant.stock <= 3 && selectedVariant.stock > 0 && (
              <p className="text-[11px] text-aplus-warning font-medium" aria-live="polite">
                Low stock: only {selectedVariant.stock} left in size {selectedVariant.size_label}
              </p>
            )}
            {selectedVariant && outOfStock && (
              <p className="text-[11px] text-aplus-error font-medium" aria-live="polite">
                Size {selectedVariant.size_label} is sold out ready-to-wear{product.is_bespoke ? ' — available made-to-measure.' : '.'}
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
                <span className="px-4 text-xs font-semibold text-navy" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
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
              disabled={outOfStock && !product.is_bespoke}
              className="w-full py-4 bg-navy hover:bg-navy-2 disabled:opacity-60 disabled:cursor-not-allowed text-ivory font-semibold text-sm rounded shadow-lg transition flex items-center justify-center space-x-2 touch-target"
            >
              <ShoppingBag className="w-5 h-5 text-gold-light" aria-hidden="true" />
              <span>{outOfStock && !product.is_bespoke ? 'Sold out' : `Add to bag • ${format(product.price_kobo * quantity)}`}</span>
            </button>

            {addedToast && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-aplus-success text-xs font-medium rounded flex items-center justify-between animate-in fade-in">
                <span className="flex items-center space-x-2">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Added to your bag.</span>
                </span>
                <Link href="/cart" className="underline font-semibold">View bag</Link>
              </div>
            )}
            {addError && (
              <p role="alert" className="p-3 bg-red-50 border border-red-200 text-aplus-error text-xs rounded">
                {addError}
              </p>
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
              <span>
                <strong>Delivery:</strong>{' '}
                {deliveryRules
                  .filter((r) => r.fee_kobo > 0)
                  .slice(0, 2)
                  .map((r) => `${r.label.split('(')[0].trim()} (${r.eta})`)
                  .join(' • ')}
              </span>
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
                  <p>• Pick-up available at our workshop: {contact.address}.</p>
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
          {avgRating !== null ? (
            <div className="flex items-center space-x-2 text-sm text-text-2">
              <div className="flex text-gold-dark" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="font-bold text-navy">{avgRating.toFixed(1)} / 5</span>
              <span className="text-xs text-text-3">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          ) : (
            <span className="text-xs text-text-3">No reviews yet — be the first.</span>
          )}
        </div>

        {reviews.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <li key={r.id} className="bg-white p-5 rounded border border-stone space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex text-gold-dark" aria-label={`${r.rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : ''}`} aria-hidden="true" />
                    ))}
                  </div>
                  <time dateTime={r.created_at} className="text-text-3">
                    {new Date(r.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </time>
                </div>
                <p className="text-text-2 leading-relaxed">{r.body}</p>
                <p className="font-semibold text-navy">
                  {r.author_name}
                  {r.author_location ? <span className="text-text-3 font-normal"> · {r.author_location}</span> : null}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Review Form */}
        <div className="bg-white p-6 rounded border border-stone">
          <h4 className="font-serif text-base text-navy font-semibold mb-2">Leave a review</h4>
          {reviewSubmitted ? (
            <div role="status" className="p-4 bg-emerald-50 text-aplus-success text-xs rounded border border-emerald-200">
              Thank you! Your review has been received and will appear once the owner approves it.
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="rev-name" className="block text-xs font-medium text-navy mb-1">Your name *</label>
                  <input
                    id="rev-name"
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Femi Adeyemi"
                    className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="rev-location" className="block text-xs font-medium text-navy mb-1">City (optional)</label>
                  <input
                    id="rev-location"
                    type="text"
                    value={reviewerLocation}
                    onChange={(e) => setReviewerLocation(e.target.value)}
                    placeholder="e.g. Lagos"
                    className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="rev-rating" className="block text-xs font-medium text-navy mb-1">Rating *</label>
                  <select
                    id="rev-rating"
                    value={reviewerRating}
                    onChange={(e) => setReviewerRating(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy min-h-[44px]"
                  >
                    <option value={5}>5 — Impeccable</option>
                    <option value={4}>4 — Great</option>
                    <option value={3}>3 — Good</option>
                    <option value={2}>2 — Fair</option>
                    <option value={1}>1 — Poor</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="rev-body" className="block text-xs font-medium text-navy mb-1">Your feedback *</label>
                <textarea
                  id="rev-body"
                  required
                  rows={3}
                  minLength={10}
                  maxLength={2000}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the fabric, the fit, and the occasion you wore it to…"
                  className="w-full px-3 py-2 text-xs bg-ivory-2 border border-stone rounded focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              {reviewError && (
                <p role="alert" className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200">
                  {reviewError}
                </p>
              )}
              <button
                type="submit"
                disabled={reviewSubmitting}
                aria-busy={reviewSubmitting}
                className="px-5 py-2.5 bg-navy hover:bg-navy-2 disabled:opacity-60 text-ivory text-xs font-semibold rounded transition min-h-[44px]"
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
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
                  {format(p.price_kobo)}
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
