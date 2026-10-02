import React from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/db';
import { ProductDetailView } from '@/components/product/ProductDetailView';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const allProducts = await getProducts({ categoryId: product.category_id });
  const relatedProducts = allProducts.filter((p) => p.id !== product.id);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
