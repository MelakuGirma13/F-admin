"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerSectionProps {
  defaultCustomer: string;
  defaultEmail: string;
  isPending: boolean;
  emailError?: string;
  customerError?: string;
}

export function CustomerSection({
  defaultCustomer,
  defaultEmail,
  isPending,
  emailError,
  customerError,
}: CustomerSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold">Customer</h2>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="customer">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer"
            name="customer"
            defaultValue={defaultCustomer}
            placeholder="Jane Smith"
            required
            disabled={isPending}
            className={customerError ? "border-destructive" : ""}
          />
          {customerError && (
            <p className="text-xs text-destructive">{customerError}</p>
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
            defaultValue={defaultEmail}
            placeholder="jane@example.com"
            required
            disabled={isPending}
            className={emailError ? "border-destructive" : ""}
          />
          {emailError && (
            <p className="text-xs text-destructive">{emailError}</p>
          )}
        </div>
      </div>
    </section>
  );
}
