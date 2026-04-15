




/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Product, ProductCategory, ProductImage, ProductPrice, ProductSize, Material } from "@prisma/client";
import db from "./db";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Prisma include object for a complete product with all relations
const productInclude = {
  categories: true,
  images: true,
  prices: true,
  sizes: true,
  material: true,
  favorites: true,
  reviews: true,
  averageRating: true,
} as const;

// Type for a product with all relations included
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// Domain filter params (used by getProducts)
export interface ProductFilterParams {
  page: number;
  pageSize: number;
  sortField: string;
  sortDir: "asc" | "desc";
  search?: string;
  isActive?: "active" | "inactive" | "all";
  isFeatured?: "featured" | "not-featured" | "all";
  categoryId?: string;
  priceMin?: string;
  priceMax?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Paginated response
export interface PaginatedProducts {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// DATA ACCESS LAYER
// ============================================================================

/**
 * Fetch a single product by ID including all related data.
 */
export async function getProductById(id: string): Promise<ProductWithRelations> {
  const product = await db.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    throw new Error(`Product not found`);
  }
  return JSON.parse(JSON.stringify(product));
 // return product;
}

/**
 * Fetch paginated, filtered, sorted list of products.
 */
export async function getProducts(
  params: ProductFilterParams
): Promise<PaginatedProducts> {
  const {
    page,
    pageSize,
    sortField,
    sortDir,
    search,
    isActive,
    isFeatured,
    categoryId,
    priceMin,
    priceMax,
    dateFrom,
    dateTo,
  } = params;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: Prisma.ProductWhereInput = {};

  // Active status filter
  if (isActive === "active") {
    where.is_active = true;
  } else if (isActive === "inactive") {
    where.is_active = false;
  }

  // Featured filter
  if (isFeatured === "featured") {
    where.is_featured = true;
  } else if (isFeatured === "not-featured") {
    where.is_featured = false;
  }

  // Category filter
  if (categoryId && categoryId !== "all") {
    where.categories = {
      some: { id: categoryId },
    };
  }

  // Price range
  if (priceMin !== undefined && priceMin !== "") {
    const min = parseFloat(priceMin);
    if (!isNaN(min)) {
      where.base_price = { gte: min };
    }
  }
  if (priceMax !== undefined && priceMax !== "") {
    const max = parseFloat(priceMax);
    if (!isNaN(max)) {
      where.base_price = { ...(where.base_price as any), lte: max };
    }
  }

  // Date range
  if (dateFrom) {
    where.created_at = { gte: new Date(dateFrom) };
  }
  if (dateTo) {
    const nextDay = new Date(dateTo);
    nextDay.setDate(nextDay.getDate() + 1);
    where.created_at = {
      ...(typeof where.created_at === "object" ? where.created_at : {}),
      lt: nextDay,
    };
  }

  // Search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  // Sorting mapping
  const fieldMap: Record<string, string> = {
    name: "name",
    company: "company",
    base_price: "base_price",
    is_active: "is_active",
    is_featured: "is_featured",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  const orderByField = fieldMap[sortField] || "created_at";
  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    [orderByField]: sortDir === "asc" ? "asc" : "desc",
  };

  const [total, productsData] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: productInclude,
    }),
  ]);

  return {
    products:JSON.parse(JSON.stringify(productsData)) ,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Update a single product's active status.
 */
export async function updateProductActive(
  productId: string,
  isActive: boolean
): Promise<ProductWithRelations> {
  const updated = await db.product.update({
    where: { id: productId },
    data: { is_active: isActive },
    include: productInclude,
  });
  return updated;
}

/**
 * Update a single product's featured status.
 */
export async function updateProductFeatured(
  productId: string,
  isFeatured: boolean
): Promise<ProductWithRelations> {
  const updated = await db.product.update({
    where: { id: productId },
    data: { is_featured: isFeatured },
    include: productInclude,
  });
  return updated;
}

/**
 * Delete a single product.
 */
export async function deleteProduct(productId: string): Promise<void> {
  await db.product.delete({
    where: { id: productId },
  });
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export async function bulkUpdateActive(
  productIds: string[],
  isActive: boolean
): Promise<void> {
  await db.product.updateMany({
    where: { id: { in: productIds } },
    data: { is_active: isActive },
  });
}

export async function bulkUpdateFeatured(
  productIds: string[],
  isFeatured: boolean
): Promise<void> {
  await db.product.updateMany({
    where: { id: { in: productIds } },
    data: { is_featured: isFeatured },
  });
}

export async function bulkDeleteProducts(productIds: string[]): Promise<void> {
  await db.product.deleteMany({
    where: { id: { in: productIds } },
  });
}

// ============================================================================
// COUNT HELPERS
// ============================================================================

export async function getProductCountByActive(isActive: boolean): Promise<number> {
  return db.product.count({ where: { is_active: isActive } });
}

export async function getProductCountByFeatured(isFeatured: boolean): Promise<number> {
  return db.product.count({ where: { is_featured: isFeatured } });
}

// ============================================================================
// CREATE PRODUCT
// ============================================================================

export interface CreateProductInput {
  userId: string;
  name: string;
  company: string;
  description: string;
  basePrice: number;
  collection: "MEN" | "WOMEN";
  isFeatured: boolean;
  isCustom: boolean;
  sizes: Array<{ size: string; quantity: number; priceModifier: number }>;
  prices: Array<{
    price: number;
    type: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    minQuantity?: number;
  }>;
  material: Array<{ name: string }>;
  categories: Array<{ id: string }>;
  images: Array<{ url: string; isMainImage: boolean }>;
}




export async function createProduct(input: CreateProductInput): Promise<ProductWithRelations> {
  // Create the product with all nested relations in one go
  const newProduct = await db.product.create({
    data: {
      name: input.name,
      company: input.company,
      description: input.description,
      base_price: input.basePrice,
      collection: input.collection,
      is_featured: input.isFeatured,
      is_custom: input.isCustom,
      user_id: input.userId,
      is_active: true,

      // Connect existing categories (implicit many-to-many)
      categories: {
        connect: input.categories.map((cat) => ({ id: cat.id })),
      },

      // Create sizes
      sizes: {
        create: input.sizes.map((s) => ({
          size: s.size,
          quantity: s.quantity,
          price_modifier: s.priceModifier,
        })),
      },

      // Create prices
      prices: {
        create: input.prices.map((p) => ({
          price: p.price,
          type: p.type,
          name: p.name ?? null,
          start_date: p.startDate ?? null,
          end_date: p.endDate ?? null,
          min_quantity: p.minQuantity ?? null,
          is_active: true,
        })),
      },

      // Create materials (note: relation is named "material" in the schema)
      material: {
        create: input.material.map((m) => ({
          name: m.name,
        })),
      },

      // Create images
      images: {
        create: input.images.map((img) => ({
          image_url: img.url,
          is_main_image: img.isMainImage,
        })),
      },
    },
    include: productInclude, // Return the complete product with all relations
  });

  return newProduct;
}
export interface UpdateProductInput {
  name?: string;
  company?: string;
  description?: string;
  basePrice?: number;
  collection?: "MEN" | "WOMEN";
  isFeatured?: boolean;
  isCustom?: boolean;
  sizes?: Array<{ size: string; quantity: number; priceModifier: number }>;
  prices?: Array<{
    price: number;
    type: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    minQuantity?: number;
  }>;
  material?: Array<{ name: string }>;
  categories?: Array<{ id: string }>;
  images?: Array<{ url: string; isMainImage: boolean }>;
}



export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<ProductWithRelations> {
  // Build the update data object with nested writes
  const updateData: Prisma.ProductUpdateInput = {};

  // Basic scalar fields
  if (input.name !== undefined) updateData.name = input.name;
  if (input.company !== undefined) updateData.company = input.company;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.basePrice !== undefined) updateData.base_price = input.basePrice;
  if (input.collection !== undefined) updateData.collection = input.collection;
  if (input.isFeatured !== undefined) updateData.is_featured = input.isFeatured;
  if (input.isCustom !== undefined) updateData.is_custom = input.isCustom;

  // Categories: replace all connections
  if (input.categories !== undefined) {
    updateData.categories = {
      set: input.categories.map((cat) => ({ id: cat.id })),
    };
  }

  // Sizes: delete all and create new ones (replace strategy)
  if (input.sizes !== undefined) {
    updateData.sizes = {
      deleteMany: {},
      create: input.sizes.map((s) => ({
        size: s.size,
        quantity: s.quantity,
        price_modifier: s.priceModifier,
      })),
    };
  }

  // Prices: delete all and create new ones
  if (input.prices !== undefined) {
    updateData.prices = {
      deleteMany: {},
      create: input.prices.map((p) => ({
        price: p.price,
        type: p.type,
        name: p.name ?? null,
        start_date: p.startDate ?? null,
        end_date: p.endDate ?? null,
        min_quantity: p.minQuantity ?? null,
        is_active: true,
      })),
    };
  }

  // Materials: delete all and create new ones (relation name is "material")
  if (input.material !== undefined) {
    updateData.material = {
      deleteMany: {},
      create: input.material.map((m) => ({
        name: m.name,
      })),
    };
  }

  // Images: delete all and create new ones
  if (input.images !== undefined) {
    updateData.images = {
      deleteMany: {},
      create: input.images.map((img) => ({
        image_url: img.url,
        is_main_image: img.isMainImage,
      })),
    };
  }

  // Perform a single update with all nested operations
  const updatedProduct = await db.product.update({
    where: { id: productId },
    data: updateData,
    include: productInclude,
  });

  return updatedProduct;
}
// ============================================================================
// DELETE PRODUCT IMAGE
// ============================================================================

export async function deleteProductImage(imageId: string): Promise<void> {
  await db.productImage.delete({
    where: { id: imageId },
  });
}

// ============================================================================
// CREATE PRODUCT CATEGORY
// ============================================================================

export interface CreateProductCategoryInput {
  name: string;
  description?: string;
}

export async function createProductCategory(
  input: CreateProductCategoryInput
): Promise<ProductCategory> {
  const existing = await db.productCategory.findFirst({
    where: {
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new Error(`Category "${input.name}" already exists.`);
  }

  return await db.productCategory.create({
    data: {
      name: input.name,
      description: input.description ?? "",
    },
  });
}