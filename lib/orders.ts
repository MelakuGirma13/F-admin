import { Prisma } from "@prisma/client"
import {
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrdersFilterParams,
  type PaginatedOrders,
} from "@/types/orders"
import db from "./db"

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Single source of truth for mapping Prisma Order models to the Domain Order interface.
 * Any future fields added to the database only need to be updated here.
 */
function mapPrismaToOrder(order: any): Order {
  return {
    id: order.id,
    customer: order.email || "", // fallback: use email as customer name
    email: order.email || "",
    order_number: order.order_number,
    status: order.status as OrderStatus,
    is_paid: order.is_paid,
    payment_link_id: order.payment_link_id,
    square_order_id: order.square_order_id,
    total: Number(order.order_total),
    tax: Number(order.tax),
    shipping: Number(order.shipping),
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    order_items: order.order_items.map(
      (item: any): OrderItem => ({
        id: item.id,
        order_id: item.order_id,
        custom_order_id: item.custom_order_id,
        product_id: item.product_id,
        size: item.size,
        name: item.product_name,
        sku: null,
        qty: item.quantity,
        price: Number(item.price),
        image_url: item.product_image,
      })
    ),
  }
}

// ============================================================================
// DATA ACCESS LAYER
// ============================================================================

/**
 * Fetch a single order by ID including its line items.
 * Throws if not found.
 */
export async function getOrderById(id: string): Promise<Order> {
  const order = await db.order.findUnique({
    where: { id },
    include: { order_items: true },
  })

  if (!order) {
    throw new Error(`Order not found`)
  }

  return mapPrismaToOrder(order)
}

/**
 * Fetch a paginated, filtered, sorted list of orders.
 */
export async function getOrders(
  params: OrdersFilterParams
): Promise<PaginatedOrders> {
  const {
    page,
    pageSize,
    sortField,
    sortDir,
    search,
    status,
    isPaid,
    dateFrom,
    dateTo,
  } = params

  const skip = (page - 1) * pageSize
  const take = pageSize

  // Restored Type Safety using Prisma's generated types
  const where: Prisma.OrderWhereInput = {}

  if (status !== "ALL") {
    where.status = status
  }

  if (isPaid === "paid") {
    where.is_paid = true
  } else if (isPaid === "unpaid") {
    where.is_paid = false
  }

  if (dateFrom) {
    where.created_at = { gte: new Date(dateFrom) }
  }
  
  if (dateTo) {
    const nextDay = new Date(dateTo)
    nextDay.setDate(nextDay.getDate() + 1)
    where.created_at = {
      ...(typeof where.created_at === "object" ? where.created_at : {}),
      lt: nextDay,
    }
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { order_number: { contains: search, mode: "insensitive" } },
    ]
  }

  const fieldMap: Record<string, string> = {
    created_at: "created_at",
    total: "order_total",
    status: "status",
    email: "email",
    id: "id",
  }
  
  const orderByField = fieldMap[sortField] || "created_at"
  const orderBy: Prisma.OrderOrderByWithRelationInput = { 
    [orderByField]: sortDir === "asc" ? "asc" : "desc" 
  }

  const [total, ordersData] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { order_items: true },
    })
  ])

  return {
    orders: ordersData.map(mapPrismaToOrder),
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
  return db.order.count({
    where: { status: status as OrderStatus },
  })
}

/**
 * Update the status of a single order.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
    include: { order_items: true },
  })

  return mapPrismaToOrder(updatedOrder)
}

/**
 * Toggle the is_paid flag of a single order.
 */
export async function toggleOrderPaid(
  orderId: string,
  isPaid: boolean
): Promise<Order> {
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: { is_paid: isPaid },
    include: { order_items: true },
  })

  return mapPrismaToOrder(updatedOrder)
}

/**
 * Cancel a single order.
 * Now utilizes existing logic rather than duplicating a database call.
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  // Assuming "CANCELLED" maps to a valid OrderStatus in your types
  return updateOrderStatus(orderId, "CANCELLED" as OrderStatus)
}

/**
 * Bulk update the status of multiple orders.
 */
export async function bulkUpdateStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<void> {
  await db.order.updateMany({
    where: { id: { in: orderIds } },
    data: { status: status as OrderStatus },
  })
}

/**
 * Bulk mark orders as paid or unpaid.
 */
export async function bulkMarkPaid(
  orderIds: string[],
  isPaid: boolean
): Promise<void> {
  await db.order.updateMany({
    where: { id: { in: orderIds } },
    data: { is_paid: isPaid },
  })
}


