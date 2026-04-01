"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const editLineItemSchema = z.object({
  // existing items have a numeric DB id; new items use a temp string id
  id: z.union([z.number(), z.string()]).nullable(),
  variantId: z.string().nullable(), // null for existing items without a variant link
  name: z.string().min(1),
  sku: z.string().nullable(),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be 0 or more"),
  image_url: z.string().nullable(),
  isNew: z.boolean(), // true = freshly added; false = pre-existing
});

const updateOrderSchema = z.object({
  email: z.string().email("Valid email required"),
  customer: z.string().min(1, "Customer name required"),
  status: z.enum(["pending", "placed", "processing", "dispatched", "completed", "cancelled"]),
  is_paid: z.boolean(),
  shipping: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  items: z
    .array(editLineItemSchema)
    .min(1, "At least one line item is required"),
});

export type UpdateOrderState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

// ─── Action ────────────────────────────────────────────────────────────────────

export async function updateOrderAction(
  orderId: string,
  _prev: UpdateOrderState,
  formData: FormData
): Promise<UpdateOrderState> {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { status: "error", message: "Invalid form data." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Could not parse form data." };
  }

  const result = updateOrderSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, customer, status, is_paid, shipping, tax, items } = result.data;

  const supabase = await createClient();

  // 1. Load existing order_items so we can reconcile stock
  const { data: existingItemsData, error: fetchError } = await supabase
    .from("order_items")
    .select("id, qty, sku")
    .eq("order_id", orderId);

  if (fetchError) {
    return { status: "error", message: `Failed to load order: ${fetchError.message}` };
  }

  // Build a map of existing item ids for quick lookup
  const existingIds = new Set((existingItemsData ?? []).map((i) => i.id));

  // 2. Delete all existing order_items (we'll replace with the new list)
  const { error: deleteError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (deleteError) {
    return { status: "error", message: `Failed to remove old items: ${deleteError.message}` };
  }

  // 3. Insert new set of order_items
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const newItems = items.map((item) => ({
    order_id: orderId,
    name: item.name,
    sku: item.sku,
    qty: item.qty,
    price: item.price,
    image_url: item.image_url,
  }));

  const { error: insertError } = await supabase.from("order_items").insert(newItems);

  if (insertError) {
    return { status: "error", message: `Failed to save items: ${insertError.message}` };
  }

  // 4. Update the order itself
  const { error: orderError } = await supabase
    .from("orders")
    .update({ email, customer, status, is_paid, total })
    .eq("id", orderId);

  if (orderError) {
    return { status: "error", message: `Failed to update order: ${orderError.message}` };
  }

  // 5. Revalidate and redirect
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}/edit`);

  redirect(`/orders`);
}
