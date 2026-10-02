'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-2 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded inline-flex items-center space-x-1.5"
    >
      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Print / Save as PDF</span>
    </button>
  );
}
