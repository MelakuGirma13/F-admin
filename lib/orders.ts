import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus, OrdersFilterParams, PaginatedOrders } from "@/types/orders";

const ORDER_SELECT = `
  id,
  customer,
  email,
  status,
  is_paid,
  total,
  created_at,
  updated_at,
  order_items ( id, order_id, name, sku, qty, price, image_url )
`;

/**
 * Apply shared WHERE conditions (filters) to any Supabase query builder.
 * Used for both the COUNT and the DATA query to guarantee they match.
 */
function applyFilters<T>(
  query: T,
  params: Pick<OrdersFilterParams, "search" | "status" | "isPaid" | "dateFrom" | "dateTo">
): T {
  const { search, status, isPaid, dateFrom, dateTo } = params;
  let q = query as any;

  if (status !== "ALL") q = q.eq("status", status);
  if (isPaid === "paid") q = q.eq("is_paid", true);
  if (isPaid === "unpaid") q = q.eq("is_paid", false);
  if (search)
    q = q.or(`id.ilike.%${search}%,email.ilike.%${search}%,customer.ilike.%${search}%`);
  if (dateFrom) q = q.gte("created_at", dateFrom);
  if (dateTo) {
    // Include the full end day by advancing to the next day
    const nextDay = new Date(dateTo);
    nextDay.setDate(nextDay.getDate() + 1);
    q = q.lt("created_at", nextDay.toISOString().split("T")[0]);
  }

  return q as T;
}

/**
 * Fetch a single order by ID including its line items.
 * Throws if not found.
 */
export async function getOrderById(id: string): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new Error(`Order not found: ${error.message}`);
  return data as Order;
}

/**
 * Fetch a paginated, filtered, sorted list of orders from Supabase.
 */
export async function getOrders(params: OrdersFilterParams): Promise<PaginatedOrders> {
  const supabase = await createClient();
  const { page, pageSize, sortField, sortDir } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // --- COUNT ---
  const countQuery = applyFilters(
    supabase.from("orders").select("id", { count: "exact", head: true }),
    params
  );
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Failed to count orders: ${countError.message}`);

  // --- DATA ---
  const dataQuery = applyFilters(
    supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order(sortField, { ascending: sortDir === "asc" })
      .range(from, to),
    params
  );
  const { data, error: dataError } = await dataQuery;
  if (dataError) throw new Error(`Failed to fetch orders: ${dataError.message}`);

  const total = count ?? 0;
  return {
    orders: (data ?? []) as Order[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Fetch count of orders for a single status (stat cards).
 */
export async function getOrderCountByStatus(status: OrderStatus): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) throw new Error(`Failed to count orders by status: ${error.message}`);
  return count ?? 0;
}

/**
 * Update the status of a single order.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single();

  if (error) throw new Error(`Failed to update order status: ${error.message}`);
  return data as Order;
}

/**
 * Toggle the is_paid flag of a single order.
 */
export async function toggleOrderPaid(
  orderId: string,
  isPaid: boolean
): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ is_paid: isPaid })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single();

  if (error) throw new Error(`Failed to update payment status: ${error.message}`);
  return data as Order;
}

/**
 * Cancel a single order (sets status to "cancelled").
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single();

  if (error) throw new Error(`Failed to cancel order: ${error.message}`);
  return data as Order;
}

/**
 * Bulk update the status of multiple orders.
 */
export async function bulkUpdateStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .in("id", orderIds);

  if (error) throw new Error(`Failed to bulk update status: ${error.message}`);
}

/**
 * Bulk mark orders as paid or unpaid.
 */
export async function bulkMarkPaid(
  orderIds: string[],
  isPaid: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ is_paid: isPaid })
    .in("id", orderIds);

  if (error) throw new Error(`Failed to bulk update payment status: ${error.message}`);
}
