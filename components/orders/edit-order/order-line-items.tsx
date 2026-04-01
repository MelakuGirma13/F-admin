"use client";

import { useState, useCallback } from "react";
import { Trash2, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductSelector } from "./product-selector";
import type { EditLineItem } from "./edit-order-form";
import { Product, ProductVariant } from "@/types/orders";

interface OrderLineItemsProps {
  items: EditLineItem[];
  onAdd: (product: Product, variant: ProductVariant) => void;
  onQtyChange: (key: string, qty: number) => void;
  onPriceChange: (key: string, price: number) => void;
  onRemove: (key: string) => void;
  isPending: boolean;
  itemsError?: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function OrderLineItems({
  items,
  onAdd,
  onQtyChange,
  onPriceChange,
  onRemove,
  isPending,
  itemsError,
}: OrderLineItemsProps) {
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const confirmRemove = useCallback(() => {
    if (removingKey) {
      onRemove(removingKey);
      setRemovingKey(null);
    }
  }, [removingKey, onRemove]);

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Line Items</h2>
        <ProductSelector onSelect={onAdd} disabled={isPending} />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use the &quot;Add product&quot; button above to add items.
            </p>
          </div>
          {itemsError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {itemsError}
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 px-4 py-3 group"
            >
              {/* Image / placeholder */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted overflow-hidden">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Name / variant */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none">
                  {item.name}
                </p>
                {item.sku && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SKU: {item.sku}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="w-24 shrink-0">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) =>
                    onPriceChange(item.key, parseFloat(e.target.value) || 0)
                  }
                  disabled={isPending}
                  className="h-8 text-right text-sm"
                  aria-label="Unit price"
                />
              </div>

              {/* Qty */}
              <div className="w-20 shrink-0">
                <Input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) =>
                    onQtyChange(item.key, parseInt(e.target.value, 10) || 1)
                  }
                  disabled={isPending}
                  className="h-8 text-center text-sm"
                  aria-label="Quantity"
                />
              </div>

              {/* Subtotal */}
              <p className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
                {fmt(item.price * item.qty)}
              </p>

              {/* Remove */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isPending}
                onClick={() => setRemovingKey(item.key)}
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {/* Footer totals row */}
          {itemsError && (
            <div className="px-4 py-2">
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {itemsError}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={!!removingKey} onOpenChange={() => setRemovingKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be removed from the order. You can add it back at
              any time before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              size="default" variant="outline"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
