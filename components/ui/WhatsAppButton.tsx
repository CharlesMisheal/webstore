'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  phoneNumber = '2347071374515',
  defaultMessage = 'Hello A-Plus Fashion Home, I would like to inquire about bespoke tailoring.',
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const chatUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Quick Help Popover */}
      {isOpen && (
        <div className="mb-3 w-72 bg-white rounded-lg shadow-xl border border-stone overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-navy p-3.5 flex items-center justify-between text-ivory border-b border-gold">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-xs">
                <p className="font-semibold">Henry Abraham & Team</p>
                <p className="text-[10px] text-gold-light">A-Plus Tailors • Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ivory/80 hover:text-ivory p-1"
              aria-label="Close WhatsApp chat prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 text-xs text-text-2 space-y-2.5 bg-ivory">
            <p className="bg-white p-2.5 rounded border border-stone/80 text-text">
              Hello! 👋 Welcome to A-Plus Fashion Home. Need instant sizing advice or want to order directly via WhatsApp?
            </p>

            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-medium rounded flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start WhatsApp Chat</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 p-3.5 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1EBE5D] hover:scale-105 active:scale-95 transition-all flex items-center justify-center focus:ring-4 focus:ring-[#25D366]/30 touch-target"
        aria-label="Chat on WhatsApp with A-Plus Fashion Home"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>
    </div>
  );
}
