/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductById } from "@/lib/products";
import { ProductDetail } from "@/components/products/components/product-detail-sheet";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Product ${id}`,
    description: `View details for product ${id}`,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
    console.log("product detail", product);
  } catch {
    notFound();
  }

  return <ProductDetail product={product as any} />;
}
