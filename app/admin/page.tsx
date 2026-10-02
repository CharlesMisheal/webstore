import React from 'react';
import Link from 'next/link';
import { getOrders, getProducts, getQuotes, getBookings } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import {
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  MessageSquare,
  Package,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const [orders, products, quotes, bookings] = await Promise.all([
    getOrders(),
    getProducts({ includeArchived: true }),
    getQuotes(),
    getBookings(),
  ]);

  // Financial Metrics
  const totalRevenueKobo = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
    .reduce((sum, o) => sum + o.total_kobo, 0);

  const pendingOrders = orders.filter((o) => o.status === 'paid' || o.status === 'processing');
  const pendingQuotes = quotes.filter((q) => q.status === 'requested');
  const pendingBookings = bookings.filter((b) => b.status === 'requested');

  // Low stock products (any variant <= 3)
  const lowStockItems = products.flatMap((p) =>
    p.variants
      .filter((v) => v.stock <= 3 && v.stock >= 0)
      .map((v) => ({ product: p, variant: v }))
  );

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone pb-4">
        <div>
          <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
            A-Plus Tailoring Headquarters
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Dashboard Overview
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded shadow-sm flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-gold-light" />
            <span>Add New Garment</span>
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 bg-white hover:bg-ivory-2 text-navy border border-stone text-xs font-semibold rounded transition"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* 4 Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Revenue */}
        <div className="bg-white p-5 rounded-lg border border-stone shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3">
            <span>Total Store Revenue</span>
            <span className="p-1.5 bg-emerald-50 text-aplus-success rounded">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">
            {formatNaira(totalRevenueKobo)}
          </p>
          <p className="text-[11px] text-aplus-success font-medium">
            {orders.length} orders processed
          </p>
        </div>

        {/* KPI 2: Active Production Orders */}
        <div className="bg-white p-5 rounded-lg border border-stone shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3">
            <span>In Tailoring / Dispatch</span>
            <span className="p-1.5 bg-blue-50 text-aplus-info rounded">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">
            {pendingOrders.length}
          </p>
          <p className="text-[11px] text-text-3">Requires atelier attention</p>
        </div>

        {/* KPI 3: Low Stock Alerts */}
        <div className="bg-white p-5 rounded-lg border border-stone shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3">
            <span>Low Stock Alerts</span>
            <span className="p-1.5 bg-amber-50 text-aplus-warning rounded">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">
            {lowStockItems.length}
          </p>
          <p className="text-[11px] text-aplus-warning font-medium">
            Variants with &le; 3 units left
          </p>
        </div>

        {/* KPI 4: Pending Quotes & Bookings */}
        <div className="bg-white p-5 rounded-lg border border-stone shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3">
            <span>Quotes & Fittings</span>
            <span className="p-1.5 bg-navy/5 text-gold-dark rounded">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">
            {pendingQuotes.length + pendingBookings.length}
          </p>
          <p className="text-[11px] text-text-3">
            {pendingQuotes.length} quotes • {pendingBookings.length} fittings
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Orders + Low Stock / Top Garments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Orders Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-stone shadow-subtle overflow-hidden space-y-4">
          <div className="p-5 border-b border-stone flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-navy">Recent Customer Orders</h2>
            <Link href="/admin/orders" className="text-xs text-gold-dark hover:underline font-semibold">
              View All Orders &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Garments</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-ivory-2/50 transition">
                    <td className="p-3 font-mono font-semibold text-navy">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-navy">{o.customer_name}</p>
                      <p className="text-[11px] text-text-3">{o.shipping_address.city}, {o.shipping_address.state}</p>
                    </td>
                    <td className="p-3">
                      <p className="line-clamp-1">{o.items[0]?.name_snapshot}</p>
                      {o.items.length > 1 && (
                        <span className="text-[10px] text-text-3">+{o.items.length - 1} more</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-navy">{formatNaira(o.total_kobo)}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-navy text-gold-light">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="px-2.5 py-1 bg-ivory-2 hover:bg-stone text-navy rounded border border-stone font-medium inline-block text-[11px]"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock & Pending Requests (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Watch */}
          <div className="bg-white rounded-lg border border-stone p-5 shadow-subtle space-y-4">
            <h3 className="font-serif text-sm font-semibold text-navy border-b border-stone pb-2 flex items-center justify-between">
              <span>Low Stock Alerts</span>
              <span className="text-xs text-aplus-warning font-sans font-bold">{lowStockItems.length} alerts</span>
            </h3>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-text-3 py-2">All product variant stocks are healthy.</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 4).map(({ product, variant }, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-stone/50 last:border-0">
                    <div>
                      <p className="font-medium text-navy line-clamp-1">{product.name}</p>
                      <p className="text-[11px] text-text-3">Size: {variant.size_label}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-aplus-warning border border-amber-200">
                      {variant.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Quotes / Bookings */}
          <div className="bg-white rounded-lg border border-stone p-5 shadow-subtle space-y-4">
            <h3 className="font-serif text-sm font-semibold text-navy border-b border-stone pb-2 flex items-center justify-between">
              <span>Awaiting Response</span>
              <Link href="/admin/requests" className="text-[11px] text-gold-dark hover:underline">
                View All &rarr;
              </Link>
            </h3>

            <div className="space-y-3 text-xs">
              {pendingQuotes.slice(0, 2).map((q) => (
                <div key={q.id} className="p-3 bg-ivory-2 rounded border border-stone space-y-1">
                  <div className="flex justify-between font-semibold text-navy">
                    <span>{q.customer_name}</span>
                    <span className="text-[10px] text-gold-dark">{q.reference}</span>
                  </div>
                  <p className="text-text-3 line-clamp-1">{q.garment}</p>
                </div>
              ))}

              {pendingBookings.slice(0, 2).map((b) => (
                <div key={b.id} className="p-3 bg-ivory-2 rounded border border-stone space-y-1">
                  <div className="flex justify-between font-semibold text-navy">
                    <span>{b.customer_name}</span>
                    <span className="text-[10px] uppercase font-bold text-navy">{b.type} Fitting</span>
                  </div>
                  <p className="text-text-3">Scheduled: {new Date(b.starts_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
