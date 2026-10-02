'use client';

import React, { useState, useEffect } from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'suits' | 'shirts' | 'pants' | 'tips'>('suits');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-ivory rounded text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-stone">
          {/* Header */}
          <div className="px-6 py-4 bg-navy flex items-center justify-between border-b border-gold">
            <div className="flex items-center space-x-2">
              <Ruler className="w-5 h-5 text-gold-light" />
              <h3 id="size-guide-title" className="text-lg font-serif text-ivory">
                A-Plus Tailoring Size Guide & Measuring Chart
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ivory/70 hover:text-ivory p-1.5 rounded transition"
              aria-label="Close size guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-stone bg-ivory-2 px-6 pt-3 space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('suits')}
              className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === 'suits'
                  ? 'border-navy text-navy font-semibold'
                  : 'border-transparent text-text-2 hover:text-navy'
              }`}
            >
              Suits & Tuxedos
            </button>
            <button
              onClick={() => setActiveTab('shirts')}
              className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === 'shirts'
                  ? 'border-navy text-navy font-semibold'
                  : 'border-transparent text-text-2 hover:text-navy'
              }`}
            >
              Dress Shirts
            </button>
            <button
              onClick={() => setActiveTab('pants')}
              className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === 'pants'
                  ? 'border-navy text-navy font-semibold'
                  : 'border-transparent text-text-2 hover:text-navy'
              }`}
            >
              Trousers
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === 'tips'
                  ? 'border-navy text-navy font-semibold'
                  : 'border-transparent text-text-2 hover:text-navy'
              }`}
            >
              How to Measure
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 text-sm text-text-2">
            {activeTab === 'suits' && (
              <div className="space-y-4">
                <p className="text-xs text-text-3">
                  All measurements are in inches. Regular (R) fits men between 5&apos;8&quot; and 6&apos;1&quot;.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone text-xs">
                        <th className="p-2.5">Size</th>
                        <th className="p-2.5">Chest</th>
                        <th className="p-2.5">Shoulder</th>
                        <th className="p-2.5">Waist</th>
                        <th className="p-2.5">Sleeve</th>
                        <th className="p-2.5">Jacket Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone text-xs">
                      <tr>
                        <td className="p-2.5 font-bold text-navy">38R</td>
                        <td className="p-2.5">38&quot;</td>
                        <td className="p-2.5">17.5&quot;</td>
                        <td className="p-2.5">32&quot;</td>
                        <td className="p-2.5">24.5&quot;</td>
                        <td className="p-2.5">29.5&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-navy">40R</td>
                        <td className="p-2.5">40&quot;</td>
                        <td className="p-2.5">18.2&quot;</td>
                        <td className="p-2.5">34&quot;</td>
                        <td className="p-2.5">25.0&quot;</td>
                        <td className="p-2.5">30.0&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-navy">42R</td>
                        <td className="p-2.5">42&quot;</td>
                        <td className="p-2.5">19.0&quot;</td>
                        <td className="p-2.5">36&quot;</td>
                        <td className="p-2.5">25.5&quot;</td>
                        <td className="p-2.5">30.5&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-navy">44R</td>
                        <td className="p-2.5">44&quot;</td>
                        <td className="p-2.5">19.7&quot;</td>
                        <td className="p-2.5">38&quot;</td>
                        <td className="p-2.5">26.0&quot;</td>
                        <td className="p-2.5">31.0&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-navy">46R</td>
                        <td className="p-2.5">46&quot;</td>
                        <td className="p-2.5">20.5&quot;</td>
                        <td className="p-2.5">40&quot;</td>
                        <td className="p-2.5">26.5&quot;</td>
                        <td className="p-2.5">31.5&quot;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-ivory-2 p-3 rounded border border-stone text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-dark mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Need a Bespoke Fit?</strong> Choose &quot;Custom Made-to-Measure&quot; on the product page or book a free fitting appointment in our Ijebu-Ode shop or via live video consultation.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'shirts' && (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                      <th className="p-2.5">Collar (Inches)</th>
                      <th className="p-2.5">Standard Size</th>
                      <th className="p-2.5">Chest</th>
                      <th className="p-2.5">Sleeve Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone">
                    <tr>
                      <td className="p-2.5 font-bold text-navy">15.0&quot;</td>
                      <td className="p-2.5">Small (S)</td>
                      <td className="p-2.5">38&quot;</td>
                      <td className="p-2.5">33.5&quot;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-navy">15.5&quot;</td>
                      <td className="p-2.5">Medium (M)</td>
                      <td className="p-2.5">40&quot;</td>
                      <td className="p-2.5">34.0&quot;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-navy">16.0&quot;</td>
                      <td className="p-2.5">Large (L)</td>
                      <td className="p-2.5">42&quot;</td>
                      <td className="p-2.5">34.5&quot;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-navy">16.5&quot;</td>
                      <td className="p-2.5">X-Large (XL)</td>
                      <td className="p-2.5">44&quot;</td>
                      <td className="p-2.5">35.0&quot;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'pants' && (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                      <th className="p-2.5">Waist Size</th>
                      <th className="p-2.5">Hip</th>
                      <th className="p-2.5">Thigh</th>
                      <th className="p-2.5">Inseam (Unfinished/Hemmed)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone">
                    <tr>
                      <td className="p-2.5 font-bold text-navy">30&quot;</td>
                      <td className="p-2.5">37&quot;</td>
                      <td className="p-2.5">23&quot;</td>
                      <td className="p-2.5">32&quot;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-navy">32&quot;</td>
                      <td className="p-2.5">39&quot;</td>
                      <td className="p-2.5">24&quot;</td>
                      <td className="p-2.5">32&quot;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-navy">34&quot;</td>
                      <td className="p-2.5">41&quot;</td>
                      <td className="p-2.5">25&quot;</td>
                      <td className="p-2.5">33&quot;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-navy">36&quot;</td>
                      <td className="p-2.5">43&quot;</td>
                      <td className="p-2.5">26&quot;</td>
                      <td className="p-2.5">33&quot;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-stone rounded">
                    <h4 className="font-semibold text-navy mb-1">1. Chest Measurement</h4>
                    <p>Wrap the tape around the fullest part of your chest, under the armpits, keeping the tape level across your shoulder blades.</p>
                  </div>
                  <div className="p-3 bg-white border border-stone rounded">
                    <h4 className="font-semibold text-navy mb-1">2. Natural Waist</h4>
                    <p>Measure around where your trousers comfortably sit, usually about 1 inch below the navel. Keep one finger between the tape and your body.</p>
                  </div>
                  <div className="p-3 bg-white border border-stone rounded">
                    <h4 className="font-semibold text-navy mb-1">3. Shoulder Width</h4>
                    <p>Measure from the outer edge of one shoulder bone across the curve of your back to the outer edge of the other shoulder bone.</p>
                  </div>
                  <div className="p-3 bg-white border border-stone rounded">
                    <h4 className="font-semibold text-navy mb-1">4. Sleeve Length</h4>
                    <p>Place one end of the tape at the shoulder seam and measure down the outside of your arm to just past your wrist bone.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 bg-ivory-2 border-t border-stone flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-navy text-ivory text-sm font-medium rounded hover:bg-navy-2 transition"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
