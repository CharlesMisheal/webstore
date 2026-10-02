'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { useCart } from '../cart/CartContext';
import { ArrowUpRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { currency } = useCart();
  const coverImage = product.images.find((img) => img.is_cover) || product.images[0];
  const imageUrl = coverImage?.storage_path || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group flex flex-col bg-white border border-stone rounded hover:border-gold transition-all duration-300 shadow-subtle hover:shadow-card overflow-hidden">
      {/* 4:5 Portrait Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-2 block"
      >
        <Image
          src={imageUrl}
          alt={coverImage?.alt || product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
          {product.is_bespoke && (
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase bg-navy text-gold-light rounded shadow-sm">
              Bespoke Tailoring
            </span>
          )}
          {product.is_featured && !product.is_bespoke && (
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase bg-ivory text-navy border border-stone rounded shadow-sm">
              Ready to Wear
            </span>
          )}
        </div>

        {/* Quick View Overlay on hover */}
        <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
          <span className="w-full py-2.5 bg-navy/95 backdrop-blur-sm text-ivory text-xs uppercase tracking-wider font-semibold rounded flex items-center justify-center space-x-1 shadow-md">
            <span>View Suit Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          {product.category && (
            <p className="text-[11px] uppercase tracking-widest text-gold-dark font-medium mb-1">
              {product.category.name}
            </p>
          )}
          <Link
            href={`/product/${product.slug}`}
            className="font-serif text-base font-semibold text-navy hover:text-gold-dark transition line-clamp-1"
          >
            {product.name}
          </Link>
          <p className="text-xs text-text-3 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-stone/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-text-3 block">From</span>
            <span className="font-semibold text-navy text-sm sm:text-base">
              {formatMoney(product.price_kobo, currency)}
            </span>
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="text-xs font-semibold text-gold-dark hover:text-navy hover:underline transition"
          >
            Tailor This &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
