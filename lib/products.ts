/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import type {
  Product,
  ProductFilterParams,
  PaginatedProducts,
  ProductCategory,
  ProductImage,
  ProductPrice,
  ProductSize,
  Material,
  Review,
} from "@/types/products";
import db from "./db";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Prisma Product model (with relations) to Domain Product interface.
 */
function mapPrismaToProduct(prismaProduct: any): Product {
  return {
    id: prismaProduct.id,
    name: prismaProduct.name,
    company: prismaProduct.company,
    description: prismaProduct.description,
    is_featured: prismaProduct.is_featured,
    created_at: prismaProduct.created_at.toISOString(),
    updated_at: prismaProduct.updated_at.toISOString(),
    user_id: prismaProduct.user_id,
    is_active: prismaProduct.is_active,
    base_price: Number(prismaProduct.base_price),
    is_custom: prismaProduct.is_custom,
    
    // Relations (optional, depending on include)
    categories: prismaProduct.categories?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
    })) || [],
    
    images: prismaProduct.images?.map((img: any): ProductImage => ({
      id: img.id,
      is_main_image: img.is_main_image,
      image_url: img.image_url,
      product_id: img.product_id,
    })) || [],
    
    prices: prismaProduct.prices?.map((price: any): ProductPrice => ({
      id: price.id,
      price: Number(price.price),
      type: price.type,
      name: price.name,
      start_date: price.start_date?.toISOString(),
      end_date: price.end_date?.toISOString(),
      min_quantity: price.min_quantity,
      is_active: price.is_active,
      created_at: price.created_at.toISOString(),
      updated_at: price.updated_at.toISOString(),
      product_id: price.product_id,
    })) || [],
    
    sizes: prismaProduct.sizes?.map((size: any): ProductSize => ({
      id: size.id,
      size: size.size,
      quantity: size.quantity,
      price_modifier: size.price_modifier,
      product_id: size.product_id,
    })) || [],
    
    material: prismaProduct.material?.map((mat: any): Material => ({
      id: mat.id,
      name: mat.name,
      product_id: mat.product_id,
    })) || [],
    
    favorites: prismaProduct.favorites?.map((fav: any) => ({
      id: fav.id,
      user_id: fav.user_id,
      product_id: fav.product_id,
      created_at: fav.created_at.toISOString(),
      updated_at: fav.updated_at.toISOString(),
    })) || [],
    
    reviews: prismaProduct.reviews?.map((rev: any): Review => ({
      id: rev.id,
      user_id: rev.user_id,
      rating: rev.rating,
      comment: rev.comment,
      author_name: rev.author_name,
      author_image_url: rev.author_image_url,
      created_at: rev.created_at.toISOString(),
      updated_at: rev.updated_at.toISOString(),
      product_id: rev.product_id,
    })) || [],
    
    averageRating: prismaProduct.averageRating ? {
      average_rating: prismaProduct.averageRating.average_rating ? Number(prismaProduct.averageRating.average_rating) : null,
      review_count: prismaProduct.averageRating.review_count,
    } : null,
  };
}

// ============================================================================
// DATA ACCESS LAYER
// ============================================================================

/**
 * Fetch a single product by ID including related data.
 */
export async function getProductById(id: string): Promise<Product> {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      categories: true,
      images: true,
      prices: true,
      sizes: true,
      material: true,
      favorites: true,
      reviews: true,
      averageRating: true,
    },
  });

  if (!product) {
    throw new Error(`Product not found`);
  }

  return mapPrismaToProduct(product);
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

  // Category filter (many-to-many through ProductCategory)
  if (categoryId && categoryId !== "all") {
    where.categories = {
      some: { id:categoryId },
    };
  }

  // Price range (base_price)
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

  // Date range (created_at)
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

  // Search (name or company)
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
      include: {
        categories: true,
        images: true,
        prices: true,
        sizes: true,
        material: true,
        favorites: true,
        reviews: true,
        averageRating: true,
      },
    }),
  ]);

  return {
    products: productsData.map(mapPrismaToProduct),
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
): Promise<Product> {
  const updated = await db.product.update({
    where: { id: productId },
    data: { is_active: isActive },
    include: {
      categories: true,
      images: true,
      prices: true,
      sizes: true,
      material: true,
      favorites: true,
      reviews: true,
      averageRating: true,
    },
  });
  return mapPrismaToProduct(updated);
}

/**
 * Update a single product's featured status.
 */
export async function updateProductFeatured(
  productId: string,
  isFeatured: boolean
): Promise<Product> {
  const updated = await db.product.update({
    where: { id: productId },
    data: { is_featured: isFeatured },
    include: {
      categories: true,
      images: true,
      prices: true,
      sizes: true,
      material: true,
      favorites: true,
      reviews: true,
      averageRating: true,
    },
  });
  return mapPrismaToProduct(updated);
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

/**
 * Bulk update active status.
 */
export async function bulkUpdateActive(
  productIds: string[],
  isActive: boolean
): Promise<void> {
  await db.product.updateMany({
    where: { id: { in: productIds } },
    data: { is_active: isActive },
  });
}

/**
 * Bulk update featured status.
 */
export async function bulkUpdateFeatured(
  productIds: string[],
  isFeatured: boolean
): Promise<void> {
  await db.product.updateMany({
    where: { id: { in: productIds } },
    data: { is_featured: isFeatured },
  });
}

/**
 * Bulk delete products.
 */
export async function bulkDeleteProducts(productIds: string[]): Promise<void> {
  await db.product.deleteMany({
    where: { id: { in: productIds } },
  });
}

// ============================================================================
// ADDITIONAL HELPERS (optional for stat cards etc.)
// ============================================================================

/**
 * Get count of products by active status.
 */
export async function getProductCountByActive(isActive: boolean): Promise<number> {
  return db.product.count({ where: { is_active: isActive } });
}

/**
 * Get count of products by featured status.
 */
export async function getProductCountByFeatured(isFeatured: boolean): Promise<number> {
  return db.product.count({ where: { is_featured: isFeatured } });
}


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
    startDate?: string;
    endDate?: string;
    minQuantity?: number;
  }>;
  materials: Array<{ name: string }>;
  categories: Array<{ name: string }>;
  images: Array<{ url: string; isMainImage: boolean }>;
}






export async function createProduct(input: CreateProductInput): Promise<Product> {
  return await db.$transaction(async (tx) => {
    // 1. Resolve category IDs from names (existing categories only)
    const categoryIds: string[] = [];
    for (const cat of input.categories) {
      const existing = await tx.productCategory.findFirst({
        where: { name: cat.name },
      });
      if (!existing) {
        throw new Error(`Category "${cat.name}" does not exist`);
      }
      categoryIds.push(existing.id);
    }

    // 2. Create product and connect existing categories in one go
    const newProduct = await tx.product.create({
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
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
    });

    // 3. Sizes, prices, materials, images (unchanged)
    if (input.sizes.length > 0) {
      await tx.productSize.createMany({
        data: input.sizes.map((s) => ({
          size: s.size,
          quantity: s.quantity,
          price_modifier: s.priceModifier,
          product_id: newProduct.id,
        })),
      });
    }

    if (input.prices.length > 0) {
      await tx.productPrice.createMany({
        data: input.prices.map((p) => ({
          price: p.price,
          type: p.type,
          name: p.name ?? null,
          start_date: p.startDate ? new Date(p.startDate) : null,
          end_date: p.endDate ? new Date(p.endDate) : null,
          min_quantity: p.minQuantity ?? null,
          is_active: true,
          product_id: newProduct.id,
        })),
      });
    }

    if (input.materials.length > 0) {
      await tx.material.createMany({
        data: input.materials.map((m) => ({
          name: m.name,
          product_id: newProduct.id,
        })),
      });
    }

    if (input.images.length > 0) {
      await tx.productImage.createMany({
        data: input.images.map((img) => ({
          image_url: img.url,
          is_main_image: img.isMainImage,
          product_id: newProduct.id,
        })),
      });
    }

    // 4. Fetch complete product with relations
    const completeProduct = await tx.product.findUnique({
      where: { id: newProduct.id },
      include: {
        categories: true,
        images: true,
        prices: true,
        sizes: true,
        material: true,
        favorites: true,
        reviews: true,
        averageRating: true,
      },
    });

    if (!completeProduct) {
      throw new Error("Failed to retrieve created product");
    }

    return mapPrismaToProduct(completeProduct);
  });
}





export interface CreateProductCategoryInput {
  name: string;
  description?: string;
}
export async function createProductCategory(
  input: CreateProductCategoryInput
): Promise<ProductCategory> {
  // Check for existing category with the same name (case-insensitive? adjust as needed)
  const existing = await db.productCategory.findFirst({
    where: {
      name: {
        equals: input.name,
        mode: "insensitive", // optional: prevent duplicate names regardless of case
      },
    },
  });

  if (existing) {
    throw new Error(`Category "${input.name}" already exists.`);
  }

  return await db.productCategory.create({
    data: {
      name: input.name,
      description: input.description ?? "", // ensure description is never null (schema requires String, not optional)
    },
  });
}