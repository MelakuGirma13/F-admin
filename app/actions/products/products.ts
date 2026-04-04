



"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  updateProductActive,
  updateProductFeatured,
  deleteProduct,
  bulkUpdateActive,
  bulkUpdateFeatured,
  bulkDeleteProducts,
} from "@/lib/products";

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