import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts, getReviews } from '@/lib/db';
import { ProductDetailView } from '@/components/product/ProductDetailView';

export const revalidate = 60;

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };
  const cover = product.images.find((i) => i.is_cover) || product.images[0];
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: { title: product.name, description: product.description?.slice(0, 160), images: cover ? [{ url: cover.storage_path }] : undefined },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product || !product.is_visible) notFound();

  const [related, reviews] = await Promise.all([
    getProducts({ categoryId: product.category_id }),
    getReviews(product.id, true),
  ]);

  return <ProductDetailView product={product} relatedProducts={related.filter((p) => p.id !== product.id)} reviews={reviews} />;
}
