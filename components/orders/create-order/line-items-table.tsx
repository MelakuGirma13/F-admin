"use client";

import { Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DraftLineItem } from "@/types/orders";

interface LineItemsTableProps {
  items: DraftLineItem[];
  onQtyChange: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}

export function LineItemsTable({ items, onQtyChange, onRemove }: LineItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 py-10 text-center">
        <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No items added yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          Use the search above to add products.
        </p>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Product</th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground w-24">Price</th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground w-28">Qty</th>
            <th className="py-2.5 px-4 text-right font-medium text-muted-foreground w-24">Total</th>
            <th className="py-2.5 px-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.variantId} className="group hover:bg-muted/20 transition-colors">
              <td className="py-3 px-4">
                <p className="font-medium text-foreground leading-snug">{item.productName}</p>
                {item.variantLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.variantLabel}</p>
                )}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                ${item.price.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-right">
                <Input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) onQtyChange(item.variantId, val);
                  }}
                  className="h-8 w-20 text-right ml-auto tabular-nums"
                  aria-label={`Quantity for ${item.productName}`}
                />
              </td>
              <td className="py-3 px-4 text-right tabular-nums font-medium">
                ${(item.price * item.qty).toFixed(2)}
              </td>
              <td className="py-3 px-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(item.variantId)}
                  aria-label={`Remove ${item.productName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/40">
            <td colSpan={3} className="py-2.5 px-4 text-right text-sm font-medium text-muted-foreground">
              Subtotal
            </td>
            <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-foreground">
              ${subtotal.toFixed(2)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
