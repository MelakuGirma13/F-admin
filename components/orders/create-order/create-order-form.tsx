"use client";

import { useActionState, useCallback, useState } from "react";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProductSearchCombobox } from "./product-search-combobox";
import { LineItemsTable } from "./line-items-table";
import { OrderSummaryCard } from "./order-summary-card";
import { DraftLineItem, ORDER_STATUSES, ORDER_STATUS_LABELS, Product, ProductVariant } from "@/types/orders";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { createOrderAction, CreateOrderState } from "@/app/actions/orders/create-order";



const initialState: CreateOrderState = { status: "idle" };

export function CreateOrderForm() {
  const [state, formAction, isPending] = useActionState(createOrderAction, initialState);
  const [items, setItems] = useState<DraftLineItem[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [status, setStatus] = useState("pending");

  const handleProductSelect = useCallback((product: Product, variant: ProductVariant) => {
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
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          price: variant.price,
          qty: 1,
          imageUrl: product.image_url,
        },
      ];
    });
  }, []);

  const handleQtyChange = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i))
    );
  }, []);

  const handleRemove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <form
      action={(fd) => {
        // Inject all state as a JSON blob so server action can validate it cleanly
        fd.set(
          "payload",
          JSON.stringify({
            customer: fd.get("customer"),
            email: fd.get("email"),
            status,
            is_paid: isPaid,
            notes: fd.get("notes") ?? "",
            items: items.map((i) => ({
              variantId: i.variantId,
              name: i.variantLabel ? `${i.productName} — ${i.variantLabel}` : i.productName,
              sku: null,
              qty: i.qty,
              price: i.price,
              image_url: i.imageUrl,
            })),
          })
        );
        formAction(fd);
      }}
      className="flex flex-col gap-0 h-full"
    >
      {/* ── Header ───────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to orders</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-none">Create Order</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {items.length === 0
                ? "Add products to get started"
                : `${items.reduce((s, i) => s + i.qty, 0)} items · $${subtotal.toFixed(2)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders">
            <Button variant="outline" size="sm" type="button" disabled={isPending}>
              Discard
            </Button>
          </Link>
          <Button size="sm" type="submit" disabled={isPending || items.length === 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — main form sections */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Error banner */}
            {state.status === "error" && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            {/* ── Customer details ── */}
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h2 className="text-sm font-medium">Customer Details</h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customer">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customer"
                    name="customer"
                    placeholder="Jane Smith"
                    required
                    disabled={isPending}
                    className={
                      state.status === "error" && state.fieldErrors?.customer
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {state.status === "error" && state.fieldErrors?.customer && (
                    <p className="text-xs text-destructive">
                      {state.fieldErrors.customer[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@example.com"
                    required
                    disabled={isPending}
                    className={
                      state.status === "error" && state.fieldErrors?.email
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {state.status === "error" && state.fieldErrors?.email && (
                    <p className="text-xs text-destructive">
                      {state.fieldErrors.email[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Optional internal notes…"
                    disabled={isPending}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </section>

            {/* ── Products ── */}
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h2 className="text-sm font-medium">Products</h2>
              </div>
              <div className="p-4 space-y-4">
                <ProductSearchCombobox onSelect={handleProductSelect} />
                {state.status === "error" && state.fieldErrors?.items && (
                  <p className="text-xs text-destructive">{state.fieldErrors.items[0]}</p>
                )}
                <LineItemsTable
                  items={items}
                  onQtyChange={handleQtyChange}
                  onRemove={handleRemove}
                />
              </div>
            </section>

          </div>

          {/* Right — sidebar */}
          <div className="flex flex-col gap-5">

            {/* ── Order settings ── */}
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h2 className="text-sm font-medium">Order Settings</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={setStatus}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Mark as paid</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle if payment was already received
                    </p>
                  </div>
                  <Switch
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                    disabled={isPending}
                    aria-label="Mark order as paid"
                  />
                </div>
              </div>
            </section>

            {/* ── Summary ── */}
            <OrderSummaryCard items={items} isPaid={isPaid} />
          </div>

        </div>
      </div>
    </form>
  );
}
