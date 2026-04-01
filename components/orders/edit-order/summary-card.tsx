"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { EditLineItem } from "./edit-order-form";
import { IsPaidBadge } from "../orders/order-status-badge";

interface SummaryCardProps {
  items: EditLineItem[];
  shipping: number;
  tax: number;
  isPaid: boolean;
  isPending: boolean;
  hasItems: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function SummaryCard({
  items,
  shipping,
  tax,
  isPaid,
  isPending,
  hasItems,
}: SummaryCardProps) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal + shipping + tax;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden sticky top-6">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold">Order Summary</h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Items list */}
        {items.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate max-w-[160px]">
                  {item.name}
                  {item.qty > 1 && (
                    <span className="ml-1 text-xs">×{item.qty}</span>
                  )}
                </span>
                <span className="tabular-nums shrink-0">
                  {fmt(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No items added
          </p>
        )}

        <Separator />

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{fmt(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="tabular-nums">{fmt(shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="tabular-nums">{fmt(tax)}</dd>
          </div>
        </dl>

        <Separator />

        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="text-base tabular-nums">{fmt(total)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Payment</span>
          <IsPaidBadge isPaid={isPaid} />
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !hasItems}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
