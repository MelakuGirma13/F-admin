import { createClient } from "@/lib/supabase/server"
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrdersFilterParams,
  PaginatedOrders,
} from "@/types/orders"
import db from "./db"

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
`

/**
 * Apply shared WHERE conditions (filters) to any Supabase query builder.
 * Used for both the COUNT and the DATA query to guarantee they match.
 */
function applyFilters<T>(
  query: T,
  params: Pick<
    OrdersFilterParams,
    "search" | "status" | "isPaid" | "dateFrom" | "dateTo"
  >
): T {
  const { search, status, isPaid, dateFrom, dateTo } = params
  let q = query as any

  if (status !== "ALL") q = q.eq("status", status)
  if (isPaid === "paid") q = q.eq("is_paid", true)
  if (isPaid === "unpaid") q = q.eq("is_paid", false)
  if (search)
    q = q.or(
      `id.ilike.%${search}%,email.ilike.%${search}%,customer.ilike.%${search}%`
    )
  if (dateFrom) q = q.gte("created_at", dateFrom)
  if (dateTo) {
    // Include the full end day by advancing to the next day
    const nextDay = new Date(dateTo)
    nextDay.setDate(nextDay.getDate() + 1)
    q = q.lt("created_at", nextDay.toISOString().split("T")[0])
  }

  return q as T
}

/**
 * Fetch a single order by ID including its line items.
 * Throws if not found.
 */
export async function getOrderById(id: string): Promise<Order> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .single()

  if (error) throw new Error(`Order not found: ${error.message}`)
  return data as Order
}

/**
 * Fetch a paginated, filtered, sorted list of orders from Supabase.
 */
export async function getOrders(
  params: OrdersFilterParams
): Promise<PaginatedOrders> {
  const { page, pageSize, sortField, sortDir, search, status, isPaid, dateFrom, dateTo } = params
  const skip = (page - 1) * pageSize
  const take = pageSize

  // ---------- Build WHERE clause ----------
  const where: any = {}

  // Status filter
  if (status !== 'ALL') {
    where.status = status
  }

  // Paid / unpaid filter
  if (isPaid === 'paid') {
    where.is_paid = true
  } else if (isPaid === 'unpaid') {
    where.is_paid = false
  }

  // Date range filters
  if (dateFrom) {
    where.created_at = { gte: new Date(dateFrom) }
  }
  if (dateTo) {
    const nextDay = new Date(dateTo)
    nextDay.setDate(nextDay.getDate() + 1)
    where.created_at = {
      ...(where.created_at || {}),
      lt: nextDay,
    }
  }

  // Search filter (id, email, order_number)
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { order_number: { contains: search, mode: 'insensitive' } },
    ]
  }

  // ---------- Sorting ----------
  // Map sortField to actual column names in the Order model
  const fieldMap: Record<string, string> = {
    created_at: 'created_at',
    total: 'order_total',
    status: 'status',
    email: 'email',
    id: 'id',
  }
  const orderByField = fieldMap[sortField] || 'created_at'
  const orderBy: any = { [orderByField]: sortDir === 'asc' ? 'asc' : 'desc' }

  // ---------- Count total (for pagination) ----------
  const total = await db.order.count({ where })

  // ---------- Fetch orders with their items ----------
  const ordersData = await db.order.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      order_items: true, // include all order item fields
    },
  })

  // ---------- Map Prisma result to your Order interface ----------
  const orders: Order[] = ordersData.map((order) => ({
    id: order.id,
    customer: order.email || '',     
    email: order.email || '',
    order_number: order.order_number,
    status: order.status as OrderStatus,
    is_paid: order.is_paid,
    total: Number(order.order_total),
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    order_items: order.order_items.map((item) => ({
      id: Number(item.id),
      order_id: item.order_id,
      name: item.product_name,
      sku: null,
      qty: item.quantity,
      price: Number(item.price),
      image_url: item.product_image,
    })) as OrderItem[],
  }))

  return {
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/**
 * Fetch count of orders for a single status (stat cards).
 */
export async function getOrderCountByStatus(
  status: OrderStatus 
): Promise<number> {
  const count = await db.order.count({
    where: { status: status as OrderStatus }
  })
  return count
}

/**
 * Update the status of a single order.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single()

  if (error) throw new Error(`Failed to update order status: ${error.message}`)
  return data as Order
}

/**
 * Toggle the is_paid flag of a single order.
 */
export async function toggleOrderPaid(
  orderId: string,
  isPaid: boolean
): Promise<Order> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .update({ is_paid: isPaid })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single()

  if (error)
    throw new Error(`Failed to update payment status: ${error.message}`)
  return data as Order
}

/**
 * Cancel a single order (sets status to "cancelled").
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single()

  if (error) throw new Error(`Failed to cancel order: ${error.message}`)
  return data as Order
}

/**
 * Bulk update the status of multiple orders.
 */
export async function bulkUpdateStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .in("id", orderIds)

  if (error) throw new Error(`Failed to bulk update status: ${error.message}`)
}

/**
 * Bulk mark orders as paid or unpaid.
 */
export async function bulkMarkPaid(
  orderIds: string[],
  isPaid: boolean
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("orders")
    .update({ is_paid: isPaid })
    .in("id", orderIds)

  if (error)
    throw new Error(`Failed to bulk update payment status: ${error.message}`)
}
