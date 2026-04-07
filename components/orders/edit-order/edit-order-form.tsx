"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerSection } from "./customer-section";
import { OrderLineItems } from "./order-line-items";
import { PricingSection } from "./pricing-section";
import { PaymentStatusSection } from "./payment-status-section";
import { SummaryCard } from "./summary-card";
import type { Order, OrderStatus, Product, ProductVariant } from "@/types/orders";
import { UpdateOrderState, updateOrderAction } from "@/app/actions/orders/update-order";
import { OrderStatusBadge } from "../orders/order-status-badge";

// ─── EditLineItem ──────────────────────────────────────────────────────────────
// Shared type used by sub-components — exported so they can import it
export interface EditLineItem {
  key: string;       // stable React key — DB id (stringified) for existing, uuid for new
  id: string | null; // DB id for existing items; null for new
  variantId: string | null;
  name: string;
  sku: string | null;
  qty: number;
  price: number;
  image_url: string | null;
  isNew: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderToEditItems(order: Order): EditLineItem[] {
  return order.order_items.map((item) => ({
    key: String(item.id),
    id: item.id,
    variantId: null,
    name: item.name,
    sku: item.sku,
    qty: item.qty,
    price: item.price,
    image_url: item.image_url,
    isNew: false,
  }));
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface EditOrderFormProps {
  order: Order;
}

const initialState: UpdateOrderState = { status: "idle" };

export function EditOrderForm({ order }: EditOrderFormProps) {
  // Bind orderId into the action
  const boundAction = updateOrderAction.bind(null, order.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Local controlled state
  const [items, setItems] = useState<EditLineItem[]>(() => orderToEditItems(order));
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [isPaid, setIsPaid] = useState(order.is_paid);
  const [status, setStatus] = useState<OrderStatus>(order.status);

  // Toast on state change
  useEffect(() => {
    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  // ── Item handlers ────────────────────────────────────────────────────────────
  const handleAdd = useCallback((product: Product, variant: ProductVariant) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key: `new-${variant.id}`,
          id: null,
          variantId: variant.id,
          name: variant.label
            ? `${product.name} — ${variant.label}`
            : product.name,
          sku: null,
          qty: 1,
          price: variant.price,
          image_url: product.image_url,
          isNew: true,
        },
      ];
    });
  }, []);

  const handleQtyChange = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i))
    );
  }, []);

  const handlePriceChange = useCallback((key: string, price: number) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, price: Math.max(0, price) } : i))
    );
  }, []);

  const handleRemove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  // ── Form submission ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (fd: FormData) => {
      fd.set(
        "payload",
        JSON.stringify({
          customer: fd.get("customer"),
          email: fd.get("email"),
          status,
          is_paid: isPaid,
          shipping,
          tax,
          items: items.map((i) => ({
            id: i.id,
            variantId: i.variantId,
            name: i.name,
            sku: i.sku,
            qty: i.qty,
            price: i.price,
            image_url: i.image_url,
            isNew: i.isNew,
          })),
        })
      );
      formAction(fd);
    },
    [formAction, items, isPaid, status, shipping, tax]
  );

  const fieldErrors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-0 min-h-screen"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to orders</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold leading-none">
                Edit Order
              </h1>
              <span className="text-sm font-mono text-muted-foreground">
                {order.id}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarDays className="h-3 w-3" />
              Created {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders">
            <Button variant="outline" size="sm" type="button" disabled={isPending}>
              Discard
            </Button>
          </Link>
          <Button
            size="sm"
            type="submit"
            disabled={isPending || items.length === 0}
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — form sections */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {state.status === "error" && !Object.keys(fieldErrors).length && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            {/* Customer */}
            <CustomerSection
              defaultCustomer={order.customer}
              defaultEmail={order.email}
              isPending={isPending}
              emailError={fieldErrors.email?.[0]}
              customerError={fieldErrors.customer?.[0]}
            />

            {/* Line items */}
            <OrderLineItems
              items={items}
              onAdd={handleAdd}
              onQtyChange={handleQtyChange}
              onPriceChange={handlePriceChange}
              onRemove={handleRemove}
              isPending={isPending}
              itemsError={fieldErrors.items?.[0]}
            />

            {/* Shipping & Tax */}
            <PricingSection
              shipping={shipping}
              tax={tax}
              onShippingChange={setShipping}
              onTaxChange={setTax}
              isPending={isPending}
            />

            {/* Payment & Status */}
            <PaymentStatusSection
              status={status}
              isPaid={isPaid}
              onStatusChange={setStatus}
              onIsPaidChange={setIsPaid}
              isPending={isPending}
            />
          </div>

          {/* Right — sticky summary */}
          <div>
            <SummaryCard
              items={items}
              shipping={shipping}
              tax={tax}
              isPaid={isPaid}
              isPending={isPending}
              hasItems={items.length > 0}
            />
          </div>

        </div>
      </div>
    </form>
  );
}
