import React from 'react';
import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/db';
import { ProductCard } from '@/components/product/ProductCard';
import { Search } from 'lucide-react';

interface ShopPageProps {
  searchParams: {
    q?: string;
    cat?: string;
    sort?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const categories = await getCategories();
  const q = searchParams.q || '';
  const currentCat = searchParams.cat || '';
  const sort = searchParams.sort || 'featured';

  let products = await getProducts({
    categoryId: currentCat || undefined,
    searchQuery: q || undefined,
  });

  // Client-side sorting logic
  if (sort === 'price_asc') {
    products.sort((a, b) => a.price_kobo - b.price_kobo);
  } else if (sort === 'price_desc') {
    products.sort((a, b) => b.price_kobo - a.price_kobo);
  } else if (sort === 'newest') {
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Page Header */}
      <div className="border-b border-stone pb-6">
        <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">
          A-Plus Fashion Home Collection
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy mt-1">
          {q ? `Search results for &ldquo;${q}&rdquo;` : 'All Formal Wear'}
        </h1>
        <p className="text-xs sm:text-sm text-text-2 mt-2 max-w-2xl leading-relaxed">
          Explore our complete collection of bespoke and ready-to-wear tailored suits, blazers, tuxedos, and dress shirts. Made in Nigeria, tailored for distinction worldwide.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded border border-stone">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
          <Link
            href="/shop"
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition ${
              !currentCat ? 'bg-navy text-ivory' : 'bg-ivory-2 text-text-2 hover:bg-stone'
            }`}
          >
            All Pieces
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?cat=${c.id}`}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition ${
                currentCat === c.id ? 'bg-navy text-ivory' : 'bg-ivory-2 text-text-2 hover:bg-stone'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Sort and Count */}
        <div className="flex items-center justify-between md:justify-end space-x-4 text-xs">
          <span className="text-text-3 font-medium">
            Showing {products.length} {products.length === 1 ? 'garment' : 'garments'}
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="text-text-3">Sort by:</span>
            <form action="/shop" method="GET" className="flex items-center gap-2">
              {currentCat && <input type="hidden" name="cat" value={currentCat} />}
              {q && <input type="hidden" name="q" value={q} />}
              <select
                name="sort"
                defaultValue={sort}
                className="bg-ivory-2 border border-stone text-navy rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-navy"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-navy text-ivory text-[10px] font-semibold uppercase tracking-wide"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone rounded-lg space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-ivory-2 flex items-center justify-center text-text-3">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl text-navy">No products found</h3>
          <p className="text-xs text-text-2 max-w-sm mx-auto">
            We couldn&apos;t find any garments matching your criteria. Try searching for &ldquo;suit&rdquo;, &ldquo;tuxedo&rdquo;, or &ldquo;blazer&rdquo;.
          </p>
          <Link
            href="/shop"
            className="inline-block px-5 py-2.5 bg-navy text-ivory text-xs font-semibold rounded hover:bg-navy-2 transition"
          >
            Clear Filters
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
