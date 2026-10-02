'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, Category } from '@/lib/types';
import { formatNaira } from '@/lib/money';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tabFilter, setTabFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Confirmation dialog state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleDeleteOrArchive = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/products?id=${deletingProduct.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      showToast(data.message || 'Product updated');
      setDeletingProduct(null);
      await loadData();
    } catch {
      showToast('Error performing operation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (tabFilter === 'active' && (p.archived_at || !p.is_visible)) return false;
    if (tabFilter === 'archived' && !p.archived_at) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Product CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone pb-4">
        <div>
          <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
            Catalogue Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Products & Suits
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded shadow-sm flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-light" />
          <span>Add New Product</span>
        </Link>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 text-aplus-success border border-emerald-200 text-xs rounded flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-stone space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setTabFilter('active')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                tabFilter === 'active' ? 'bg-navy text-ivory font-semibold' : 'bg-ivory-2 text-text-2 hover:bg-stone'
              }`}
            >
              Active Store ({products.filter((p) => !p.archived_at && p.is_visible).length})
            </button>
            <button
              onClick={() => setTabFilter('archived')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                tabFilter === 'archived' ? 'bg-navy text-ivory font-semibold' : 'bg-ivory-2 text-text-2 hover:bg-stone'
              }`}
            >
              Archived ({products.filter((p) => p.archived_at).length})
            </button>
            <button
              onClick={() => setTabFilter('all')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                tabFilter === 'all' ? 'bg-navy text-ivory font-semibold' : 'bg-ivory-2 text-text-2 hover:bg-stone'
              }`}
            >
              All Items ({products.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-8 pr-3 py-1.5 bg-ivory-2 border border-stone rounded text-xs focus:ring-1 focus:ring-navy w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-text-3 absolute left-2.5 top-2" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-ivory-2 border border-stone rounded px-2.5 py-1.5 text-xs text-navy focus:ring-1 focus:ring-navy"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table for Desktop / Stacked Cards for Mobile */}
      <div className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 mx-auto text-text-3" />
            <h3 className="font-serif text-lg text-navy">No Products Found</h3>
            <p className="text-xs text-text-3">No products match your current tab or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                  <th className="p-3.5">Garment / Cover</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Sizes & Stock</th>
                  <th className="p-3.5">Visibility</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {filteredProducts.map((prod) => {
                  const cover = prod.images.find((i) => i.is_cover) || prod.images[0];
                  const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);

                  return (
                    <tr key={prod.id} className="hover:bg-ivory-2/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-14 relative rounded bg-ivory-2 border border-stone overflow-hidden flex-shrink-0">
                            {cover && (
                              <Image
                                src={cover.storage_path}
                                alt={prod.name}
                                fill
                                className="object-cover object-top"
                              />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${prod.id}`}
                              className="font-serif font-bold text-navy hover:text-gold-dark transition"
                            >
                              {prod.name}
                            </Link>
                            <p className="text-[11px] text-text-3">
                              Slug: {prod.slug} {prod.is_bespoke && '• Bespoke'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-text-2 font-medium">
                        {prod.category?.name || 'Uncategorized'}
                      </td>

                      <td className="p-3.5 font-bold text-navy">
                        {formatNaira(prod.price_kobo)}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className={`font-semibold ${totalStock <= 5 ? 'text-aplus-warning' : 'text-navy'}`}>
                            {totalStock} in stock
                          </span>
                          <p className="text-[11px] text-text-3">
                            {prod.variants.length} size variants
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {prod.archived_at ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-stone text-text-2">
                            Archived
                          </span>
                        ) : prod.is_visible ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-emerald-50 text-aplus-success border border-emerald-200">
                            Visible
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-amber-50 text-aplus-warning border border-amber-200">
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/products/${prod.id}`}
                            className="p-1.5 text-navy hover:text-gold-dark border border-stone rounded hover:bg-ivory-2 transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(prod)}
                            className="p-1.5 text-text-3 hover:text-aplus-error border border-stone rounded hover:bg-red-50 transition"
                            title="Delete or Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Delete / Archive */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg border border-stone shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 text-aplus-error rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-navy">
                  Confirm Product Removal
                </h3>
                <p className="text-xs text-text-2">
                  Are you sure you want to remove <strong>{deletingProduct.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-ivory-2 p-3.5 rounded border border-stone text-xs text-text-3 leading-relaxed">
              <p>
                <strong>Security Rule:</strong> If this garment has existing client order history, it will be <strong>safely archived</strong> instead of deleted to protect order records. Products without order history will be deleted.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-stone rounded text-xs font-semibold text-text-2 hover:bg-ivory-2 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrArchive}
                disabled={isDeleting}
                className="px-4 py-2 bg-aplus-error hover:bg-red-700 text-white rounded text-xs font-semibold transition"
              >
                {isDeleting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
