'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Category, ProductVariant, ProductImage } from '@/lib/types';
import { nairaToKobo, koboToNaira, formatNaira } from '@/lib/money';
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Check, Image as ImageIcon } from 'lucide-react';

interface ProductFormProps {
  initialProduct?: Product;
  categories: Category[];
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || categories[0]?.id || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [priceNaira, setPriceNaira] = useState(initialProduct ? koboToNaira(initialProduct.price_kobo) : 150000);
  const [isBespoke, setIsBespoke] = useState(initialProduct?.is_bespoke || false);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured || false);
  const [isVisible, setIsVisible] = useState(initialProduct ? initialProduct.is_visible : true);

  // Images state
  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images || [
      {
        id: `img_${Date.now()}`,
        product_id: initialProduct?.id || '',
        storage_path: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        alt: 'Front View',
        sort_order: 1,
        is_cover: true,
      },
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants || [
      { id: `var_1`, product_id: '', size_label: '38R', sku: 'APF-38R', stock: 5 },
      { id: `var_2`, product_id: '', size_label: '40R', sku: 'APF-40R', stock: 8 },
      { id: `var_3`, product_id: '', size_label: '42R', sku: 'APF-42R', stock: 6 },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const newImg: ProductImage = {
      id: `img_${Date.now()}`,
      product_id: initialProduct?.id || '',
      storage_path: newImageUrl.trim(),
      alt: `${name} photo`,
      sort_order: images.length + 1,
      is_cover: images.length === 0,
    };
    setImages([...images, newImg]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (updated.length > 0 && !updated.some((img) => img.is_cover)) {
      updated[0].is_cover = true;
    }
    setImages(updated);
  };

  const handleSetCover = (idx: number) => {
    setImages(images.map((img, i) => ({ ...img, is_cover: i === idx })));
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const updated = [...images];
    const item = updated.splice(from, 1)[0];
    updated.splice(to, 0, item);
    setImages(updated.map((img, i) => ({ ...img, sort_order: i + 1 })));
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `var_${Date.now()}`,
        product_id: initialProduct?.id || '',
        size_label: '44R',
        sku: `APF-${Date.now().toString().slice(-4)}`,
        stock: 5,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: string | number) => {
    const updated = [...variants];
    // @ts-expect-error dynamic property update
    updated[index][field] = val;
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialProduct) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    try {
      const priceKobo = nairaToKobo(priceNaira);

      const payload = {
        id: initialProduct?.id,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: categoryId,
        description,
        price_kobo: priceKobo,
        is_bespoke: isBespoke,
        is_featured: isFeatured,
        is_visible: isVisible,
        images,
        variants,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products"
            className="p-2 bg-ivory-2 hover:bg-stone text-navy rounded border border-stone transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-navy">
              {initialProduct ? `Edit Garment: ${initialProduct.name}` : 'Create New Garment'}
            </h1>
            <p className="text-xs text-text-3">Configure bespoke specs, sizing variants, and photography.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-navy hover:bg-navy-2 disabled:opacity-70 text-ivory text-xs font-semibold rounded shadow-sm transition"
        >
          {isSaving ? 'Saving...' : 'Save Product'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-aplus-error text-xs rounded border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-stone space-y-4 shadow-subtle">
        <h2 className="font-serif text-base font-semibold text-navy border-b border-stone pb-2">
          Basic Garment Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-navy mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Navy Executive Three-Piece Suit"
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
            />
          </div>

          <div>
            <label className="block font-medium text-navy mb-1">URL Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. navy-executive-three-piece-suit"
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-navy mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-navy mb-1">Price (in Nigerian Naira ₦) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-text-3 font-semibold">₦</span>
              <input
                type="number"
                required
                min={0}
                step={500}
                value={priceNaira}
                onChange={(e) => setPriceNaira(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy font-semibold text-navy"
              />
            </div>
            <span className="text-[10px] text-text-3 mt-1 block">
              Stored in DB as: {nairaToKobo(priceNaira).toLocaleString()} kobo
            </span>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-navy mb-1">Description & Fabric Notes</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the lapel style, lining, chest canvassing, and fabric weight..."
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBespoke}
                onChange={(e) => setIsBespoke(e.target.checked)}
                className="rounded text-navy focus:ring-navy"
              />
              <span className="font-semibold text-navy">Bespoke Tailoring Option</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-navy focus:ring-navy"
              />
              <span className="font-semibold text-navy">Featured on Homepage</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="rounded text-navy focus:ring-navy"
              />
              <span className="font-semibold text-navy">Visible on Storefront</span>
            </label>
          </div>
        </div>
      </div>

      {/* Multi-Image Gallery Manager */}
      <div className="bg-white p-6 rounded-lg border border-stone space-y-4 shadow-subtle text-xs">
        <h2 className="font-serif text-base font-semibold text-navy border-b border-stone pb-2 flex items-center justify-between">
          <span>Photography Gallery</span>
          <span className="text-text-3 font-sans text-xs">4:5 portrait recommended</span>
        </h2>

        {/* Existing Images */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative rounded border p-2 space-y-2 ${
                img.is_cover ? 'border-navy bg-navy/5 ring-1 ring-navy' : 'border-stone bg-ivory-2'
              }`}
            >
              <div className="relative aspect-[4/5] rounded overflow-hidden bg-white border border-stone">
                <Image src={img.storage_path} alt={img.alt || 'Photo'} fill className="object-cover" />
                {img.is_cover && (
                  <span className="absolute top-1 left-1 bg-navy text-gold-light text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Cover Image
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMoveImage(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 hover:bg-stone rounded disabled:opacity-30"
                    title="Move earlier"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(idx, idx + 1)}
                    disabled={idx === images.length - 1}
                    className="p-1 hover:bg-stone rounded disabled:opacity-30"
                    title="Move later"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  {!img.is_cover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      className="text-xs text-gold-dark hover:underline font-semibold"
                    >
                      Make Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 text-text-3 hover:text-aplus-error"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Image URL */}
        <div className="pt-2 flex space-x-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Paste public image URL (e.g. from Supabase Storage / CDN)..."
            className="flex-1 px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-4 py-2 bg-navy hover:bg-navy-2 text-ivory rounded font-semibold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Image</span>
          </button>
        </div>
      </div>

      {/* Variants & Stock Manager */}
      <div className="bg-white p-6 rounded-lg border border-stone space-y-4 shadow-subtle text-xs">
        <div className="flex items-center justify-between border-b border-stone pb-2">
          <h2 className="font-serif text-base font-semibold text-navy">
            Sizes & Variant Stock
          </h2>
          <button
            type="button"
            onClick={handleAddVariant}
            className="px-3 py-1 bg-ivory-2 hover:bg-stone border border-stone rounded text-navy font-semibold flex items-center space-x-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Size Variant</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                <th className="p-2.5">Size Label</th>
                <th className="p-2.5">SKU Code</th>
                <th className="p-2.5">Units in Stock</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {variants.map((v, idx) => (
                <tr key={v.id}>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={v.size_label}
                      onChange={(e) => handleUpdateVariant(idx, 'size_label', e.target.value)}
                      placeholder="e.g. 40R"
                      className="px-2 py-1 bg-ivory-2 border border-stone rounded text-xs w-36 font-semibold"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={v.sku || ''}
                      onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                      placeholder="e.g. APF-NVY-40R"
                      className="px-2 py-1 bg-ivory-2 border border-stone rounded text-xs w-36 font-mono"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                      className="px-2 py-1 bg-ivory-2 border border-stone rounded text-xs w-24 font-bold"
                    />
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      disabled={variants.length === 1}
                      className="text-text-3 hover:text-aplus-error p-1 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
