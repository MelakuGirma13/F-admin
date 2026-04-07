"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order, OrderStatus } from "@/types/orders";
import {
  Mail,
  Package,
  User,
  Hash,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { updateOrderStatusAction } from "@/app/actions/orders/orders";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "ORDER_PLACED",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ORDER_PLACED: "Order Placed",
  PROCESSING: "Processing",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDateTime = (date: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailModal = ({
  order,
  open,
  onClose,
}: OrderDetailModalProps): React.ReactElement => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!order) return <></>;

  const activeStatus = currentStatus ?? order.status;

  const handleStatusChange = (value: string): void => {
    const newStatus = value as OrderStatus;
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, newStatus);
      if (!result.error) { //TODO: check for success
        setCurrentStatus(newStatus);
      } else {
        setError(result.error ?? "Failed to update status.");
      }
    });
  };

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground font-mono">
                {order.id}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Order details and status management
              </p>
            </div>
            <OrderStatusBadge status={activeStatus} className="self-start sm:self-auto" />
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Customer & Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Customer">
              {order.customer}
            </InfoRow>
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email">
              {order.email}
            </InfoRow>
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Placed">
              {formatDateTime(order.created_at)}
            </InfoRow>
            <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="Order ID">
              <span className="font-mono text-xs">{order.id}</span>
            </InfoRow>
          </div>

          <Separator className="bg-border" />

          {/* Status Update */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              Update Status
            </h3>
            <Select
              value={activeStatus}
              onValueChange={handleStatusChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-full sm:w-56 h-9 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            {isPending && (
              <p className="mt-2 text-xs text-muted-foreground">Updating status...</p>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              Order Items
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {order.order_items.length}{" "}
                {order.order_items.length === 1 ? "item" : "items"}
              </span>
            </h3>
            <ul className="space-y-3">
              {order.order_items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Qty: {item.qty}
                      {item.sku && (
                        <span className="ml-2 font-mono">SKU: {item.sku}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(item.price * item.qty)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(item.price)} ea.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-border" />

          {/* Order Summary */}
          <div>
            <dl className="space-y-2 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <Separator className="bg-border my-1" />
              <SummaryRow
                label="Total"
                value={formatCurrency(order.total)}
                bold
              />
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}): React.ReactElement => (
  <div className="flex flex-col gap-0.5">
    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {icon}
      {label}
    </dt>
    <dd className="text-sm text-foreground pl-5">{children}</dd>
  </div>
);

const SummaryRow = ({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}): React.ReactElement => (
  <div
    className={`flex items-center justify-between ${
      bold ? "font-semibold text-foreground" : "text-muted-foreground"
    }`}
  >
    <dt>{label}</dt>
    <dd className="tabular-nums">{value}</dd>
  </div>
);
