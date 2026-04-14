



"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  updateProductActive,
  updateProductFeatured,
  deleteProduct,
  bulkUpdateActive,
  bulkUpdateFeatured,
  bulkDeleteProducts,
  createProduct,
  CreateProductInput,
  createProductCategory,
  updateProduct,
  deleteProductImage as deleteProductImageDb,
} from "@/lib/products";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------
// Zod schemas matching the payload from the form
const sizeSchema = z.object({
  size: z.string().min(1),
  quantity: z.number().int().min(0),
  price_modifier: z.number().int().default(0), // snake_case
});

const priceSchema = z.object({
  price: z.number().positive(),
  type: z.string().default("STANDARD"),
  name: z.string().optional(),
  start_date: z.string().datetime().optional(), // ISO string
  end_date: z.string().datetime().optional(),
  min_quantity: z.number().int().positive().optional(),
  is_active: z.boolean().default(true),
});

const materialSchema = z.object({
  name: z.string().min(1),
});

const categorySchema = z.object({
  id: z.string().min(1),
  // name is not needed; we connect by ID
});

const imageSchema = z.object({
  image_url: z.string().url(),
  is_main_image: z.boolean(),
});

// ----------------------------------------------------------------------
// Create Product
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().min(1, "Description is required"),
  base_price: z.number().positive("Base price must be positive"),
  collection: z.enum(["MEN", "WOMEN"]),
  is_featured: z.boolean().default(false),
  is_custom: z.boolean().default(false),
  sizes: z.array(sizeSchema),
  prices: z.array(priceSchema),
  material: z.array(materialSchema), // singular as in schema
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
    base_price,
    collection,
    is_featured,
    is_custom,
    sizes,
    prices,
    material,
    categories,
    images,
  } = result.data;


const userId ='6776c13e-8178-4f4f-8531-b54af8ba8f98'
  try {
    // The lib function expects CreateProductInput which may use camelCase.
    // We map snake_case payload to camelCase as needed by the library.
    const product = await createProduct({
      userId,
      name,
      company,
      description,
      basePrice: base_price,
      collection,
      isFeatured: is_featured,
      isCustom: is_custom,
      sizes: sizes.map((s) => ({
        size: s.size,
        quantity: s.quantity,
        priceModifier: s.price_modifier,
      })),
      prices: prices.map((p) => ({
        price: p.price,
        type: p.type,
        name: p.name,
        startDate: p.start_date ? new Date(p.start_date) : undefined,
        endDate: p.end_date ? new Date(p.end_date) : undefined,
        minQuantity: p.min_quantity,
        isActive: p.is_active,
      })),
      materials: material.map((m) => ({ name: m.name })),
      categories: categories.map((c) => ({ id: c.id })),
      images: images.map((img) => ({
        url: img.image_url,
        isMainImage: img.is_main_image,
      })),
    } as CreateProductInput);

    //revalidatePath("/products");
   // redirect(`/products/${product.id}?created=true`);
  } catch (error) {
    console.error("Product creation error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create product.",
    };
  }
}

// ----------------------------------------------------------------------
// Update Product
const updateProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().min(1, "Description is required"),
  base_price: z.number().positive("Base price must be positive"),
  collection: z.enum(["MEN", "WOMEN"]),
  is_featured: z.boolean().default(false),
  is_custom: z.boolean().default(false),
  sizes: z.array(sizeSchema),
  prices: z.array(priceSchema),
  material: z.array(materialSchema),
  categories: z.array(categorySchema),
  images: z.array(imageSchema),
});

export type UpdateProductState =
  | { status: "idle" }
  | { status: "success"; productId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function updateProductAction(
  _prev: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
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

  const result = updateProductSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    id,
    name,
    company,
    description,
    base_price,
    collection,
    is_featured,
    is_custom,
    sizes,
    prices,
    material,
    categories,
    images,
  } = result.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { status: "error", message: "Unauthorized. Please log in." };
  }

  try {
    const product = await updateProduct(id, {
      name,
      company,
      description,
      basePrice: base_price,
      collection,
      isFeatured: is_featured,
      isCustom: is_custom,
      sizes: sizes.map((s) => ({
        size: s.size,
        quantity: s.quantity,
        priceModifier: s.price_modifier,
      })),
      prices: prices.map((p) => ({
        price: p.price,
        type: p.type,
        name: p.name,
        startDate: p.start_date ? new Date(p.start_date) : undefined,
        endDate: p.end_date ? new Date(p.end_date) : undefined,
        minQuantity: p.min_quantity,
        isActive: p.is_active,
      })),
      materials: material.map((m) => ({ name: m.name })),
      categories: categories.map((c) => ({ id: c.id })),
      images: images.map((img) => ({
        url: img.image_url,
        isMainImage: img.is_main_image,
      })),
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidateTag("products", "max");

    return { status: "success", productId: product.id };
  } catch (error) {
    console.error("Product update error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update product.",
    };
  }
}

// ----------------------------------------------------------------------
// Delete Product Image (from storage and database)
export async function deleteProductImage(imageId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();

    const { data: image, error: fetchError } = await supabase
      .from("ProductImage")
      .select("image_url") // note: column is image_url per schema
      .eq("id", imageId)
      .single();

    if (fetchError || !image) {
      throw new Error("Image not found in database.");
    }

    const path = image.image_url;
    const { error: storageError } = await supabase.storage
      .from("products_bucket")
      .remove([path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
    }

    await deleteProductImageDb(imageId);

    revalidatePath("/products");
    revalidateTag("products", "max");

    return {};
  } catch (error) {
    console.error("Delete image error:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete image." };
  }
}

// ----------------------------------------------------------------------
// Path and tag invalidation
const PATH = "/products";
const PRODUCTS_TAG = "products";

function invalidate() {
  revalidatePath(PATH);
  revalidateTag(PRODUCTS_TAG, "max");
}

// ----------------------------------------------------------------------
// Single product toggle actions
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

// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// Convenience aliases
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

// ----------------------------------------------------------------------
// Image upload to Supabase Storage
export async function uploadImageToSupabase(file: File): Promise<string> {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from("products_bucket")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("products_bucket").getPublicUrl(data.path);

  return publicUrl;
}

// ----------------------------------------------------------------------
// Category creation
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  description: z.string().optional(),
});

export async function createCategoryAction(input: {
  name: string;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Unauthorized. Please log in.",
    };
  }

  const validation = createCategorySchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please check the form.",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const category = await createProductCategory({
      name: validation.data.name,
      description: validation.data.description,
    });

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Category creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category.",
    };
  }
}