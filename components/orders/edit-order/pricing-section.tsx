"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingSectionProps {
  shipping: number;
  tax: number;
  onShippingChange: (v: number) => void;
  onTaxChange: (v: number) => void;
  isPending: boolean;
}

export function PricingSection({
  shipping,
  tax,
  onShippingChange,
  onTaxChange,
  isPending,
}: PricingSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold">Shipping &amp; Tax</h2>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="shipping">Shipping ($)</Label>
          <Input
            id="shipping"
            type="number"
            min="0"
            step="0.01"
            value={shipping}
            onChange={(e) => onShippingChange(parseFloat(e.target.value) || 0)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax">Tax ($)</Label>
          <Input
            id="tax"
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(e) => onTaxChange(parseFloat(e.target.value) || 0)}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
}
