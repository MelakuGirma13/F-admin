"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/types/orders";
import type { OrderStatus } from "@/types/orders";

interface PaymentStatusSectionProps {
  status: OrderStatus;
  isPaid: boolean;
  onStatusChange: (v: OrderStatus) => void;
  onIsPaidChange: (v: boolean) => void;
  isPending: boolean;
}

export function PaymentStatusSection({
  status,
  isPaid,
  onStatusChange,
  onIsPaidChange,
  isPending,
}: PaymentStatusSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold">Payment &amp; Status</h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Order status</Label>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as OrderStatus)}
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
            onCheckedChange={onIsPaidChange}
            disabled={isPending}
            aria-label="Mark order as paid"
          />
        </div>
      </div>
    </section>
  );
}
