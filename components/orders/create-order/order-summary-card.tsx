"use client";

import { ShoppingCart, Tag, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { DraftLineItem } from "@/types/orders";

interface OrderSummaryCardProps {
  items: DraftLineItem[];
  isPaid: boolean;
}

export function OrderSummaryCard({ items, isPaid }: OrderSummaryCardProps) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Order Summary</h3>
      </div>

      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No items yet</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.variantId} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate pr-2">
                  {item.productName}
                  {item.variantLabel ? ` — ${item.variantLabel}` : ""}
                  {" "}
                  <span className="text-muted-foreground/60">×{item.qty}</span>
                </span>
                <span className="tabular-nums font-medium shrink-0">
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Items ({itemCount})
            </span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground pt-1">
            <span>Total</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Payment</span>
          <span
            className={`ml-auto font-medium ${
              isPaid ? "text-status-completed" : "text-muted-foreground"
            }`}
          >
            {isPaid ? "Paid" : "Unpaid"}
          </span>
        </div>
      </div>
    </div>
  );
}
