'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from './CartContext';
export function CartDrawer() {
  const { items, subtotalKobo, format, isCartOpen, setIsCartOpen, updateQty, removeItem } = useCart();

  // Escape key closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-ivory border-l border-stone flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 bg-navy border-b border-gold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-gold-light" />
              <h2 className="text-lg font-serif text-ivory tracking-wide">Your Shopping Bag</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-ivory/70 hover:text-ivory rounded-md hover:bg-navy-2 transition"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stone">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-ivory-2 border border-stone flex items-center justify-center text-text-3 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl text-navy mb-2">Your Bag is Empty</h3>
                <p className="text-sm text-text-2 max-w-xs mb-6">
                  Explore our collection of bespoke suits, tuxedos, and tailored blazers.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-navy text-ivory font-medium rounded hover:bg-navy-2 transition"
                >
                  Shop the Collection
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex space-x-4">
                  <div className="w-20 h-24 relative rounded bg-ivory-2 overflow-hidden flex-shrink-0 border border-stone">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-medium text-navy text-sm hover:text-gold-dark transition line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-text-3 hover:text-aplus-error p-1 transition"
                          title="Remove item"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-text-2 mt-1 space-x-2">
                        <span className="inline-block bg-ivory-2 px-1.5 py-0.5 rounded border border-stone">
                          Size: {item.size_label}
                        </span>
                        <span className="inline-block bg-ivory-2 px-1.5 py-0.5 rounded border border-stone capitalize">
                          {item.fit_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone rounded bg-white">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="px-2.5 py-1 text-sm text-text hover:bg-ivory-2 transition"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-navy min-w-[24px] text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="px-2.5 py-1 text-sm text-text hover:bg-ivory-2 transition"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-semibold text-navy text-sm">
                        {format(item.unit_price_kobo * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Actions */}
          {items.length > 0 && (
            <div className="border-t border-stone p-6 bg-white space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-text-2">
                  <span>Subtotal</span>
                  <span className="font-semibold text-navy text-base">
                    {format(subtotalKobo)}
                  </span>
                </div>
                <p className="text-xs text-text-3">
                  Delivery calculated at checkout. Currency is charged in NGN.
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 bg-navy text-ivory font-medium rounded flex items-center justify-center space-x-2 hover:bg-navy-2 transition shadow-md touch-target"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-medium text-navy hover:text-gold-dark border border-stone rounded hover:bg-ivory-2 transition block"
                >
                  View Full Cart
                </Link>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 text-center text-xs font-medium text-text-2 hover:text-navy underline"
                >
                  Continue shopping · your bag is saved
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
