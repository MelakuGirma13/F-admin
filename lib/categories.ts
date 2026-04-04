// lib/categories.ts

import db from "./db";

export interface Category {
  id: string;
  name: string;
  description: string;
}

/**
 * Fetch all product categories from the database.
 * Returns an array of categories sorted by name.
 */
export async function getAllCategories(): Promise<Category[]> {
  const categories = await db.productCategory.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return categories;
}

/**
 * Fetch a single category by ID.
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const category = await db.productCategory.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return category;
}

/**
 * Create a new product category.
 */
export async function createCategory(data: {
  name: string;
  description: string;
}): Promise<Category> {
  const category = await db.productCategory.create({
    data: {
      name: data.name,
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return category;
}

/**
 * Update an existing category.
 */
export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string }>
): Promise<Category> {
  const category = await db.productCategory.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return category;
}

/**
 * Delete a category.
 * Note: This will only remove the category, not the products.
 * The many-to-many relations (ProductCategory) will be automatically cleaned up by the database (onDelete: Cascade).
 */
export async function deleteCategory(id: string): Promise<void> {
  await db.productCategory.delete({
    where: { id },
  });
}