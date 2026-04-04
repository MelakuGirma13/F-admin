// types/products.ts

import type { Collection } from "@prisma/client"; // or your local enum

export interface Product {
  id: string;
  name: string;
  company: string;
  description: string;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  is_active: boolean;
  base_price: number; // Decimal maps to number in JS
  is_custom: boolean;
  
  // Relations (optional, depending on what you include in your query)
  averageRating?: {
    average_rating: number | null;
    review_count: number | null;
  } | null;
  categories?: ProductCategory[];
  images?: ProductImage[];
  prices?: ProductPrice[];
  sizes?: ProductSize[];
  material?: Material[];
  favorites?: Favorite[];
  reviews?: Review[];
  custom_order?: CustomOrder[];
  cart_items?: CartItem[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
}

export interface ProductImage {
  id: string;
  is_main_image: boolean;
  image_url: string;
  product_id: string;
}

export interface ProductPrice {
  id: string;
  price: number;
  type: string;
  name?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  min_quantity?: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_id: string;
}

export interface ProductSize {
  id: string;
  size: string;
  quantity: number;
  price_modifier: number;
  product_id: string;
}

export interface Material {
  id: string;
  name: string;
  product_id: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  author_name: string;
  author_image_url: string;
  created_at: Date;
  updated_at: Date;
  product_id: string;
}

export interface CustomOrder {
  id: string;
  user_id: string;
  product_id?: string | null;
  order_type: string;
  collection: Collection;
  occasion?: string | null;
  custom_order_notes?: string | null;
  is_self_measured: boolean;
  liability_accepted: boolean;
  staff_notes?: string | null;
  email?: string | null;
  contact_info_id?: string | null;
  special_instructions?: string | null;
  customization_fee: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id: string;
  amount: number;
  product_id?: string | null;
  size_id?: string | null;
  cart_id: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// SORTING & FILTERING TYPES (for product list queries)
// ============================================================================

export type SortDir = "asc" | "desc";

export type SortField = 
  | "name"
  | "company"
  | "base_price"
  | "is_active"
  | "is_featured"
  | "created_at"
  | "updated_at";

export type ActiveFilter = "all" | "active" | "inactive";
export type FeaturedFilter = "all" | "featured" | "not-featured";

export interface ProductFilterParams {
  page: number;
  pageSize: number;
  sortField: SortField;
  sortDir: SortDir;
  search: string;
  isActive: ActiveFilter;
  isFeatured: FeaturedFilter;
  categoryId: string;           // "all" or specific category id
  priceMin: string;             // empty string or numeric string
  priceMax: string;
  dateFrom: string;
  dateTo: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Optional convenience constants for UI filters
export const PRODUCT_ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "All Products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const PRODUCT_FEATURED_OPTIONS: { value: FeaturedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "not-featured", label: "Not Featured" },
];