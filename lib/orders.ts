import {
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrdersFilterParams,
  type PaginatedOrders,
} from "@/types/orders"
import db from "./db"

/**
 * Fetch a single order by ID including its line items.
 * Throws if not found.
 */
export async function getOrderById(id: string): Promise<Order> {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      order_items: true,
    },
  })

  if (!order) {
    throw new Error(`Order not found`)
  }

  // Map Prisma result to your Order interface
  return {
    id: order.id,
    customer: order.email || "", // fallback: use email as customer name
    email: order.email || "",
    order_number: order.order_number,
    status: order.status as OrderStatus,
    is_paid: order.is_paid,
    payment_link_id: order.payment_link_id,
    square_order_id:order.square_order_id,
    total: Number(order.order_total),
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    order_items: order.order_items.map(
      (item): OrderItem => ({
        id: Number(item.id),
        order_id: item.order_id,
        name: item.product_name,
        sku: null,
        qty: item.quantity,
        price: Number(item.price),
        image_url: item.product_image,
      })
    ),
  }
}

/**
 * Fetch a paginated, filtered, sorted list of orders from Supabase.
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

  // ---------- Build WHERE clause ----------
  const where: any = {}

  // Status filter
  if (status !== "ALL") {
    where.status = status
  }

  // Paid / unpaid filter
  if (isPaid === "paid") {
    where.is_paid = true
  } else if (isPaid === "unpaid") {
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
      { id: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { order_number: { contains: search, mode: "insensitive" } },
    ]
  }

  // ---------- Sorting ----------
  // Map sortField to actual column names in the Order model
  const fieldMap: Record<string, string> = {
    created_at: "created_at",
    total: "order_total",
    status: "status",
    email: "email",
    id: "id",
  }
  const orderByField = fieldMap[sortField] || "created_at"
  const orderBy: any = { [orderByField]: sortDir === "asc" ? "asc" : "desc" }

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
    customer: order.email || "",
    email: order.email || "",
    order_number: order.order_number,
    status: order.status as OrderStatus,
    is_paid: order.is_paid,
    payment_link_id: order.payment_link_id,
    square_order_id:order.square_order_id,
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
    where: { status: status as OrderStatus },
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
  // Update the order status
  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
    include: {
      order_items: true,
    },
  })

  // Map to your Order interface
  return {
    id: updatedOrder.id,
    customer: updatedOrder.email || "",
    email: updatedOrder.email || "",
    order_number: updatedOrder.order_number,
    status: updatedOrder.status as OrderStatus,
    is_paid: updatedOrder.is_paid,
    payment_link_id: updatedOrder.payment_link_id,
    square_order_id:updatedOrder.square_order_id,
    total: Number(updatedOrder.order_total),
    created_at: updatedOrder.created_at.toISOString(),
    updated_at: updatedOrder.updated_at.toISOString(),
    order_items: updatedOrder.order_items.map(
      (item): OrderItem => ({
        id: Number(item.id),
        order_id: item.order_id,
        name: item.product_name,
        sku: null,
        qty: item.quantity,
        price: Number(item.price),
        image_url: item.product_image,
      })
    ),
  }
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
    include: {
      order_items: true,
    },
  })

  return {
    id: updatedOrder.id,
    customer: updatedOrder.email || "",
    email: updatedOrder.email || "",
    order_number: updatedOrder.order_number,
    status: updatedOrder.status as OrderStatus,
    is_paid: updatedOrder.is_paid,
    payment_link_id: updatedOrder.payment_link_id,
    square_order_id:updatedOrder.square_order_id,
    total: Number(updatedOrder.order_total),
    created_at: updatedOrder.created_at.toISOString(),
    updated_at: updatedOrder.updated_at.toISOString(),
    order_items: updatedOrder.order_items.map(
      (item): OrderItem => ({
        id: Number(item.id),
        order_id: item.order_id,
        name: item.product_name,
        sku: null,
        qty: item.quantity,
        price: Number(item.price),
        image_url: item.product_image,
      })
    ),
  }
}
/**
 * Cancel a single order (sets status to "cancelled").
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  const cancelledOrder = await db.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
    include: {
      order_items: true,
    },
  })

  return {
    id: cancelledOrder.id,
    customer: cancelledOrder.email || "",
    email: cancelledOrder.email || "",
    order_number: cancelledOrder.order_number,
    status: cancelledOrder.status as OrderStatus,
    is_paid: cancelledOrder.is_paid,
    payment_link_id: cancelledOrder.payment_link_id,
    square_order_id:cancelledOrder.square_order_id,
    total: Number(cancelledOrder.order_total),
    created_at: cancelledOrder.created_at.toISOString(),
    updated_at: cancelledOrder.updated_at.toISOString(),
    order_items: cancelledOrder.order_items.map(
      (item): OrderItem => ({
        id: Number(item.id),
        order_id: item.order_id,
        name: item.product_name,
        sku: null,
        qty: item.quantity,
        price: Number(item.price),
        image_url: item.product_image,
      })
    ),
  }
}

/**
 * Bulk update the status of multiple orders.
 */
export async function bulkUpdateStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<void> {
  await db.order.updateMany({
    where: {
      id: {
        in: orderIds,
      },
    },
    data: {
      status: status as OrderStatus,
    },
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
    where: {
      id: {
        in: orderIds,
      },
    },
    data: {
      is_paid: isPaid,
    },
  })
}
