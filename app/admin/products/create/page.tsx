import type { Metadata } from "next";
import { CreateProductForm } from "@/components/products/components/create-product-form";

export const metadata: Metadata = {
  title: "Create Product",
  description: "Create a new product",
  openGraph: {
    title: "Create Product | Products Admin",
    description: "Create a new product",
  },
};

export default function CreateProductPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CreateProductForm />
    </div>
  );
}
