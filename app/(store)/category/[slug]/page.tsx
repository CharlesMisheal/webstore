import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProducts, getCategories } from '@/lib/db';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronRight } from 'lucide-react';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }

  const products = await getProducts({ categoryId: category.id });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-text-3">
        <Link href="/" className="hover:text-navy transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-navy transition">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-navy font-semibold">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-navy text-ivory p-8 sm:p-10 rounded-lg border-b-2 border-gold relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="text-xs uppercase tracking-widest text-gold-light font-semibold">
            Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-ivory">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-stone text-xs sm:text-sm leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Products Count and Grid */}
      <div className="flex items-center justify-between border-b border-stone pb-3 text-xs text-text-3">
        <span>Showing {products.length} {products.length === 1 ? 'garment' : 'garments'}</span>
        <Link href="/size-guide" className="text-gold-dark hover:underline font-medium">
          View Sizing Chart &rarr;
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone rounded-lg space-y-3">
          <h3 className="font-serif text-lg text-navy">No products currently listed in this category</h3>
          <p className="text-xs text-text-2">We are constantly crafting new garments. In the meantime, browse our other collections or request a custom quote.</p>
          <Link href="/quote" className="inline-block px-5 py-2.5 bg-navy text-ivory text-xs font-semibold rounded">
            Request Custom Bespoke Quote
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
