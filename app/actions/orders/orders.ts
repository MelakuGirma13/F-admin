"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  updateOrderStatus,
  toggleOrderPaid,
  cancelOrder,
  bulkUpdateStatus,
  bulkMarkPaid,
} from "@/lib/orders";
import type { OrderStatus } from "@/types/orders";

const PATH = "/orders";

// Cache tag shared across all order mutations so stat counts refresh on change
const ORDERS_TAG = "orders";

function invalidate() {
  revalidatePath(PATH);
  revalidateTag(ORDERS_TAG, "max");
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<{ error?: string }> {
  try {
    await updateOrderStatus(orderId, status);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update status." };
  }
}

export async function toggleOrderPaidAction(
  orderId: string,
  isPaid: boolean
): Promise<{ error?: string }> {
  try {
    await toggleOrderPaid(orderId, isPaid);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update payment." };
  }
}

export async function cancelOrderAction(
  orderId: string
): Promise<{ error?: string }> {
  try {
    await cancelOrder(orderId);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel order." };
  }
}

export async function bulkUpdateStatusAction(
  orderIds: string[],
  status: OrderStatus
): Promise<{ error?: string }> {
  try {
    await bulkUpdateStatus(orderIds, status);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to bulk update status." };
  }
}

export async function bulkMarkPaidAction(
  orderIds: string[],
  isPaid: boolean
): Promise<{ error?: string }> {
  try {
    await bulkMarkPaid(orderIds, isPaid);
    invalidate();
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to bulk update payment." };
  }
}
