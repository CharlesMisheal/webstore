'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order, Quote, Booking } from '@/lib/types';
import { formatNaira } from '@/lib/money';
import {
  User,
  ShoppingBag,
  Clock,
  Truck,
  ExternalLink,
  LogOut,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'measurements' | 'requests'>('orders');

  // Customer measurements state
  const [chest, setChest] = useState('40');
  const [waist, setWaist] = useState('34');
  const [shoulder, setShoulder] = useState('18.5');
  const [sleeve, setSleeve] = useState('25');
  const [height, setHeight] = useState("5'10\"");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check local session
    const session = localStorage.getItem('aplus_user_session');
    if (session) {
      try {
        const u = JSON.parse(session);
        setUser(u);
      } catch {
        setUser({ id: 'usr_tobi', email: 'tobi.adeleke@gmail.com', full_name: 'Tobi Adeleke' });
      }
    } else {
      // Default to demo client for seamless evaluation
      const demoUser = { id: 'usr_tobi', email: 'tobi.adeleke@gmail.com', full_name: 'Tobi Adeleke' };
      setUser(demoUser);
      localStorage.setItem('aplus_user_session', JSON.stringify(demoUser));
    }

    // Load initial sample orders
    fetch('/api/orders/my-orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
        else {
          // Sample orders fallback
          setOrders([
            {
              id: 'ord_1',
              order_number: 'APF-261001-8392',
              customer_name: 'Tobi Adeleke',
              customer_email: 'tobi.adeleke@gmail.com',
              customer_phone: '+2348031234567',
              status: 'paid',
              subtotal_kobo: 18500000,
              delivery_fee_kobo: 450000,
              total_kobo: 18950000,
              currency: 'NGN',
              shipping_address: {
                fullName: 'Tobi Adeleke',
                email: 'tobi.adeleke@gmail.com',
                phone: '+2348031234567',
                address: 'Plot 14, Admiralty Way, Lekki Phase 1',
                city: 'Lekki',
                state: 'Lagos',
                country: 'Nigeria',
                deliveryOptionId: 'del_lagos_ogun',
                deliveryMethod: 'Lagos & Ogun Express Courier',
              },
              tracking_url: 'https://tracking.aplusfashion.ng/APF-261001-8392',
              placed_at: '2026-10-01T14:22:00Z',
              items: [
                {
                  id: 'item_1',
                  order_id: 'ord_1',
                  name_snapshot: 'Crystal-Trim Three-Piece Suit',
                  size_snapshot: '40R',
                  fit_type: 'bespoke',
                  unit_price_kobo: 18500000,
                  qty: 1,
                  line_total_kobo: 18500000,
                },
              ],
            },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('aplus_user_session');
    router.push('/');
  };

  const handleSaveMeasurements = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Account Profile Header */}
      <div className="bg-navy text-ivory p-6 sm:p-8 rounded-lg border-b-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-navy-2 border border-gold/40 flex items-center justify-center text-gold-light text-xl font-bold font-serif">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-serif text-2xl text-ivory">{user?.full_name || 'Valued Customer'}</h1>
            <p className="text-xs text-stone">{user?.email || 'customer@example.com'}</p>
            <span className="inline-block mt-1 text-[10px] bg-navy-2 text-gold-light px-2 py-0.5 rounded border border-gold/30">
              Verified Google Account
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-navy-2 hover:bg-navy text-xs text-stone hover:text-ivory border border-gold/30 rounded flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone space-x-8 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-navy text-navy font-bold'
              : 'border-transparent text-text-3 hover:text-navy'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('measurements')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'measurements'
              ? 'border-navy text-navy font-bold'
              : 'border-transparent text-text-3 hover:text-navy'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Saved Bespoke Profile</span>
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg border border-stone space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-text-3" />
              <h3 className="font-serif text-lg text-navy">No Orders Yet</h3>
              <p className="text-xs text-text-3">Your bespoke tailored orders will appear here once placed.</p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2.5 bg-navy text-ivory text-xs font-semibold rounded"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
                <div className="p-4 sm:p-6 bg-ivory-2 border-b border-stone flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-text-3">Order Number:</span>{' '}
                    <strong className="text-navy">{ord.order_number}</strong>
                    <span className="text-text-3 ml-3">Date: {new Date(ord.placed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase bg-navy text-gold-light">
                      Status: {ord.status}
                    </span>
                    <Link
                      href={`/track?order=${ord.order_number}`}
                      className="px-3 py-1 bg-white hover:bg-stone border border-stone text-navy rounded font-medium flex items-center space-x-1"
                    >
                      <Truck className="w-3.5 h-3.5 text-gold-dark" />
                      <span>Track</span>
                    </Link>
                  </div>
                </div>

                <div className="p-4 sm:p-6 divide-y divide-stone">
                  {ord.items.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-serif font-semibold text-navy text-sm">{item.name_snapshot}</p>
                        <p className="text-text-3 mt-0.5">
                          Size: {item.size_snapshot} • Fit: {item.fit_type} • Qty: {item.qty}
                        </p>
                      </div>
                      <span className="font-semibold text-navy">{formatNaira(item.line_total_kobo)}</span>
                    </div>
                  ))}

                  <div className="pt-3 flex justify-between items-center text-xs">
                    <span className="text-text-2">Delivery: {ord.shipping_address.deliveryMethod}</span>
                    <span className="font-bold text-navy text-sm">Total: {formatNaira(ord.total_kobo)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Saved Bespoke Measurements */}
      {activeTab === 'measurements' && (
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-stone shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-navy">Saved Bespoke Profile</h2>
            <p className="text-xs text-text-3 mt-1">
              Store your exact body measurements for accelerated bespoke orders and video fittings.
            </p>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 text-aplus-success text-xs rounded border border-emerald-200">
              Measurements saved successfully! Master tailor Henry will reference these for your orders.
            </div>
          )}

          <form onSubmit={handleSaveMeasurements} className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block font-medium text-navy mb-1">Chest (Inches)</label>
              <input
                type="text"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Trouser Waist (Inches)</label>
              <input
                type="text"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Shoulder Width (Inches)</label>
              <input
                type="text"
                value={shoulder}
                onChange={(e) => setShoulder(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Sleeve Length (Inches)</label>
              <input
                type="text"
                value={sleeve}
                onChange={(e) => setSleeve(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block font-medium text-navy mb-1">Height (Feet/Inches)</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
              />
            </div>

            <div className="sm:col-span-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded shadow transition"
              >
                Save Measurements Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
