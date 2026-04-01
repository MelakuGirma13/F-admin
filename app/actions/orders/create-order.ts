"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const lineItemSchema = z.object({
  variantId: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().nullable(),
  qty: z.number().int().min(1),
  price: z.number().min(0),
  image_url: z.string().nullable(),
});

const createOrderSchema = z.object({
  customer: z.string().min(1, "Customer name is required"),
  email: z.string().email("Valid email is required"),
  status: z.enum(["pending", "placed", "processing", "dispatched", "completed", "cancelled"]),
  is_paid: z.boolean(),
  notes: z.string(),
  items: z.array(lineItemSchema).min(1, "At least one item is required"),
});

export type CreateOrderState =
  | { status: "idle" }
  | { status: "success"; orderId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function createOrderAction(
  _prev: CreateOrderState,
  formData: FormData
): Promise<CreateOrderState> {
  // Parse JSON-serialised payload from form
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

  const result = createOrderSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { customer, email, status, is_paid, items } = result.data;
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const supabase = await createClient();

  // Generate a human-readable order ID
  const orderId = `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Insert order
  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    customer,
    email,
    status,
    is_paid,
    total: Math.round(total * 100) / 100,
  });

  if (orderError) {
    return { status: "error", message: orderError.message };
  }

  // Insert line items
  const lineItems = items.map((item) => ({
    order_id: orderId,
    name: item.name,
    sku: item.sku,
    qty: item.qty,
    price: item.price,
    image_url: item.image_url,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(lineItems);

  if (itemsError) {
    // Roll back: delete the order
    await supabase.from("orders").delete().eq("id", orderId);
    return { status: "error", message: itemsError.message };
  }

  revalidatePath("/orders");
  redirect(`/orders?highlight=${orderId}`);
}
