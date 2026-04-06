



"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  updateProductActive,
  updateProductFeatured,
  deleteProduct,
  bulkUpdateActive,
  bulkUpdateFeatured,
  bulkDeleteProducts,createProduct, CreateProductInput,
} from "@/lib/products";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";


// Zod schemas for nested models
const sizeSchema = z.object({
  size: z.string().min(1),
  quantity: z.number().int().min(0),
  priceModifier: z.number().int().default(0),
});

const priceSchema = z.object({
  price: z.number().positive(),
  type: z.string().default("STANDARD"),
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minQuantity: z.number().int().positive().optional(),
});

const materialSchema = z.object({
  name: z.string().min(1),
});

const categorySchema = z.object({
  name: z.string().min(1),
});

const imageSchema = z.object({
  url: z.string().url(),
  isMainImage: z.boolean(),
});

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().min(1, "Description is required"),
  basePrice: z.number().positive("Base price must be positive"),
  collection: z.enum(["MEN", "WOMEN"]),
  isFeatured: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  sizes: z.array(sizeSchema),
  prices: z.array(priceSchema),
  materials: z.array(materialSchema),
  categories: z.array(categorySchema),
  images: z.array(imageSchema),
});

export type CreateProductState =
  | { status: "idle" }
  | { status: "success"; productId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function createProductAction(
  _prev: CreateProductState,
  formData: FormData
): Promise<CreateProductState> {
  // 1. Extract and parse JSON payload
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { status: "error", message: "Invalid form data." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Could not parse form data." };
  }

  // 2. Validate with Zod
  const result = createProductSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    name,
    company,
    description,
    basePrice,
    collection,
    isFeatured,
    isCustom,
    sizes,
    prices,
    materials,
    categories,
    images,
  } = result.data;

  // 3. Authenticate user via Supabase
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Unauthorized. Please log in." };
  }

  const userId = user.id;

  // 4. Call product service to create everything
  try {
    const product = await createProduct({
      userId,
      name,
      company,
      description,
      basePrice,
      collection,
      isFeatured,
      isCustom,
      sizes,
      prices,
      materials,
      categories,
      images,
    } as CreateProductInput);

    revalidatePath("/products");
    redirect(`/products/${product.id}?created=true`);
  } catch (error) {
    console.error("Product creation error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create product.",
    };
  }
}
const PATH = "/products";
const PRODUCTS_TAG = "products";

function invalidate() {
  revalidatePath(PATH);
  revalidateTag(PRODUCTS_TAG, "max");
}

// Single product actions
export async function updateProductActiveStatusAction(
  productId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  try {
    await updateProductActive(productId, isActive);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update product status." };
  }
}

export async function updateProductFeaturedAction(
  productId: string,
  isFeatured: boolean
): Promise<{ error?: string }> {
  try {
    await updateProductFeatured(productId, isFeatured);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update featured status." };
  }
}

export async function deleteProductAction(
  productId: string
): Promise<{ error?: string }> {
  try {
    await deleteProduct(productId);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete product." };
  }
}

// Bulk actions
export async function bulkUpdateActiveStatusAction(
  productIds: string[],
  isActive: boolean
): Promise<{ error?: string }> {
  try {
    await bulkUpdateActive(productIds, isActive);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to bulk update status." };
  }
}

export async function bulkUpdateFeaturedAction(
  productIds: string[],
  isFeatured: boolean
): Promise<{ error?: string }> {
  try {
    await bulkUpdateFeatured(productIds, isFeatured);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to bulk update featured." };
  }
}

export async function bulkDeleteProductsAction(
  productIds: string[]
): Promise<{ error?: string }> {
  try {
    await bulkDeleteProducts(productIds);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to bulk delete products." };
  }
}

// Additional toggle actions for convenience (used by ProductDetailSheet)
export async function toggleProductFeaturedAction(
  productId: string,
  isFeatured: boolean
): Promise<{ error?: string }> {
  return updateProductFeaturedAction(productId, isFeatured);
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  return updateProductActiveStatusAction(productId, isActive);
}