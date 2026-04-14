/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductById } from "@/lib/products";
import { EditProductForm } from "@/components/products/components/edit-product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Product ${id}`,
    description: `Edit and update product ${id}`,
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
    console.log("productbyid",product);
  } catch {
    notFound();
  }

  return <EditProductForm product={product as any} />;
}
