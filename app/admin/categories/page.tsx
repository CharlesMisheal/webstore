'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/lib/types';
import { Layers, Plus, Trash2, Edit2, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newImagePath, setNewImagePath] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  };

  const handleSaveEdit = async (cat: Category) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cat, name: editName, slug: editSlug }),
      });
      if (res.ok) {
        setEditingId(null);
        showToast('Category renamed successfully');
        await loadCategories();
      }
    } catch {
      showError('Failed to update category');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const slug = newSlug.trim() || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug,
          image_path: newImagePath.trim() || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
          sort_order: categories.length + 1,
          is_visible: true,
        }),
      });

      if (res.ok) {
        setNewName('');
        setNewSlug('');
        setNewImagePath('');
        showToast('New category added');
        await loadCategories();
      }
    } catch {
      showError('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Category deleted');
        await loadCategories();
      } else {
        showError(data.message || 'Cannot delete category');
      }
    } catch {
      showError('Error deleting category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone pb-4">
        <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
          Store Taxonomy
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Category Hierarchy
        </h1>
        <p className="text-xs text-text-3 mt-1">Organize suit, blazer, and formal wear collections on the storefront.</p>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 text-aplus-success border border-emerald-200 text-xs rounded flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 text-aplus-error border border-red-200 text-xs rounded flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Category Form */}
      <div className="bg-white p-5 rounded-lg border border-stone shadow-subtle space-y-3">
        <h2 className="font-serif text-sm font-semibold text-navy">Add New Category</h2>
        <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-text-3 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              }}
              placeholder="e.g. Traditional Kaftans"
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-3 mb-1">URL Slug</label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="e.g. traditional-kaftans"
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-3 mb-1">Header Image URL</label>
            <input
              type="url"
              value={newImagePath}
              onChange={(e) => setNewImagePath(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-navy hover:bg-navy-2 text-ivory rounded font-semibold text-xs transition flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4 text-gold-light" />
              <span>Create Category</span>
            </button>
          </div>
        </form>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                <th className="p-3.5">Sort</th>
                <th className="p-3.5">Category Name</th>
                <th className="p-3.5">URL Slug</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-ivory-2/40 transition">
                  <td className="p-3.5 font-bold text-navy">{idx + 1}</td>

                  <td className="p-3.5">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 bg-ivory-2 border border-navy rounded font-semibold text-navy w-48 text-xs"
                      />
                    ) : (
                      <span className="font-serif font-bold text-navy text-sm">{cat.name}</span>
                    )}
                  </td>

                  <td className="p-3.5 font-mono text-text-3">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="px-2 py-1 bg-ivory-2 border border-navy rounded text-navy w-48 text-xs font-mono"
                      />
                    ) : (
                      cat.slug
                    )}
                  </td>

                  <td className="p-3.5">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-emerald-50 text-aplus-success border border-emerald-200">
                      Active
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {editingId === cat.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-text-3 hover:bg-ivory-2 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-navy hover:text-gold-dark border border-stone rounded hover:bg-ivory-2"
                            title="Rename Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-text-3 hover:text-aplus-error border border-stone rounded hover:bg-red-50"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
