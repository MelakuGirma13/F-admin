// Matches the `order_status` PostgreSQL enum in Supabase
export type OrderStatus =
  | "PENDING"
  | "ORDER_PLACED"
  | "PROCESSING"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "ORDER_PLACED",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

export const ORDER_STATUSES_ACTION_LIST: OrderStatus[] = [
  "PENDING",
  "ORDER_PLACED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "PENDING",
  ORDER_PLACED: "ORDER_PLACED",
  PROCESSING: "PROCESSING",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  CANCELLED: "Cancelled",
};

// Matches the `order_items` table
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  custom_order_id ?: string;
  name: string;
  sku: string | null;
  qty: number;
  price: number;
  size: string;
  image_url: string | null;
}

// Matches the `orders` table, with items joined
export interface Order {
  id: string;
  customer: string;
  email: string;
  order_number: string;
  status: OrderStatus;
  is_paid: boolean;
  payment_link_id: string | null;
  square_order_id: string | null;
  tax: number;
  shipping: number;
  total: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

// Sort direction
export type SortDir = "asc" | "desc";

// Sortable columns
export type SortField = "created_at" | "total" | "status" | "customer" | "email";

// Filter / pagination params used by the data layer
export interface OrdersFilterParams {
  search: string;
  status: OrderStatus | "ALL";
  isPaid: "all" | "paid" | "unpaid";
  dateFrom: string; // ISO date string or ""
  dateTo: string;   // ISO date string or ""
  sortField: SortField;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


//=================
//TODO: update 
export interface DraftLineItem {
  variantId: string;
  productName: string;
  variantLabel: string | null;
  price: number;
  qty: number;
  imageUrl: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string | null;
  price: number;
  stock_qty: number;
  available_for_sale: boolean;
}

export interface Product {
  id: string;
  name: string;
  image_url: string | null;
  product_variants: ProductVariant[];
}