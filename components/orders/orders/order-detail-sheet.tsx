"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Printer,
  RotateCcw,
  Package,
  XCircle,
  Copy,
  Check,
  Mail,
  User,
  MapPin,
  Tag,
  CreditCard,
  Truck,
  ExternalLink,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  ShoppingBag,
  Loader2,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, IsPaidBadge } from "./order-status-badge";
import type { Order, OrderStatus } from "@/types/orders";
import { toggleOrderPaidAction, updateOrderStatusAction, cancelOrderAction } from "@/app/actions/orders/orders";
import { ScrollArea } from "@/components/ui/scroll-area";


// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const formatShort = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={copy}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-status-completed" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? "Copied!" : `Copy ${label}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono,
  copyValue,
  href,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyValue?: string;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <span
        className={cn(
          "text-xs text-foreground text-right flex items-center gap-1.5",
          mono && "font-mono"
        )}
      >
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            {value}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        ) : (
          value
        )}
        {copyValue && <CopyButton value={copyValue} label={label} />}
      </span>
    </div>
  );
}

// ─── Fulfillment timeline ─────────────────────────────────────────────────────

type TimelineStep = {
  key: OrderStatus;
  label: string;
  description: string;
};

const TIMELINE_STEPS: TimelineStep[] = [
  { key: "placed",     label: "Order Placed",    description: "Order received and confirmed" },
  { key: "processing", label: "Processing",       description: "Items being prepared" },
  { key: "dispatched", label: "Dispatched",       description: "Package handed to carrier" },
  { key: "completed",  label: "Delivered",        description: "Order delivered to customer" },
];

const STATUS_STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  pending:     -1,
  placed:      0,
  processing:  1,
  dispatched:  2,
  completed:   3,
  cancelled:   -2,
};

function FulfillmentTimeline({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_STEP_INDEX[status] ?? -1;
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-sm text-destructive font-medium">Order cancelled</span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const upcoming = idx > currentIdx;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0 mt-0.5",
                  done   && "border-status-completed bg-status-completed/10",
                  active && "border-status-placed bg-status-placed/10",
                  upcoming && "border-border bg-muted/40"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-completed" />
                ) : active ? (
                  <Circle className="h-3.5 w-3.5 text-status-placed fill-status-placed" />
                ) : (
                  <Circle className="h-3 w-3 text-border" />
                )}
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-6",
                    done ? "bg-status-completed/40" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="pb-1 pt-0.5">
              <p
                className={cn(
                  "text-xs font-medium",
                  upcoming ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity item ────────────────────────────────────────────────────────────

type ActivityEvent = { label: string; time: string; icon: React.ElementType; color: string };

function buildActivityLog(order: Order): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      label: "Order placed",
      time: order.created_at,
      icon: ShoppingBag,
      color: "text-status-placed",
    },
  ];
  if (order.is_paid) {
    events.push({
      label: "Payment confirmed",
      time: order.updated_at,
      icon: CreditCard,
      color: "text-status-completed",
    });
  }
  if (order.status === "processing") {
    events.push({ label: "Order processing started", time: order.updated_at, icon: Package, color: "text-status-processing" });
  }
  if (order.status === "dispatched") {
    events.push({ label: "Order dispatched", time: order.updated_at, icon: Truck, color: "text-status-dispatched" });
  }
  if (order.status === "completed") {
    events.push({ label: "Order delivered", time: order.updated_at, icon: CheckCircle2, color: "text-status-completed" });
  }
  if (order.status === "cancelled") {
    events.push({ label: "Order cancelled", time: order.updated_at, icon: XCircle, color: "text-destructive-foreground" });
  }
  return events.reverse();
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function OrderDetailSheetSkeleton({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[560px] p-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-border space-y-3 animate-pulse">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function OrderDetailSheet({ order, open, onClose }: OrderDetailSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  if (!order) return null;

  const subtotal = order.order_items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const activityLog = buildActivityLog(order);

  const runAction = (key: string, fn: () => Promise<{ error?: string }>) => {
    setPendingAction(key);
    startTransition(async () => {
      const res = await fn();
      setPendingAction(null);
      if (res.error) toast.error(res.error);
      else toast.success("Order updated.");
    });
  };

  const isBusy = isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[560px] p-0 flex flex-col gap-0 [&>button]:top-5 [&>button]:right-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="font-mono text-sm font-semibold tracking-tight text-foreground">
                  {order.id}
                </SheetTitle>
                <CopyButton value={order.id} label="Order ID" />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <OrderStatusBadge status={order.status} />
            <IsPaidBadge isPaid={order.is_paid} />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => window.print()}
              disabled={isBusy}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={isBusy || order.is_paid}
              onClick={() =>
                runAction("refund", () => toggleOrderPaidAction(order.id, false))
              }
            >
              {pendingAction === "refund" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Refund
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={
                isBusy ||
                order.status === "completed" ||
                order.status === "cancelled"
              }
              onClick={() =>
                runAction("fulfill", () =>
                  updateOrderStatusAction(order.id, "completed")
                )
              }
            >
              {pendingAction === "fulfill" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
              Fulfill
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 text-destructive-foreground hover:bg-destructive/10 hover:text-destructive-foreground border-destructive/30"
              disabled={isBusy || order.status === "cancelled"}
              onClick={() =>
                runAction("cancel", () => cancelOrderAction(order.id))
              }
            >
              {pendingAction === "cancel" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Cancel
            </Button>
          </div>
        </SheetHeader>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-7">

            {/* 1. Customer Information */}
            <Section title="Customer Information" icon={User}>
              <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-foreground">
                      {order.customer.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" />
                      {order.email}
                    </p>
                  </div>
                  <CopyButton value={order.email} label="email" />
                </div>
                <InfoRow label="Phone" value={<span className="text-muted-foreground italic">Not provided</span>} />
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground italic">No address on file</div>
                  </div>
                </div>
              </div>
            </Section>

            <Separator />

            {/* 2. Order Items */}
            <Section title={`Order Items (${order.order_items.length})`} icon={ShoppingBag}>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-3">
                      <div className="h-11 w-11 shrink-0 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {item.sku && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                              {item.sku}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Qty {item.qty} &times; {fmt.format(item.price)}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                        {fmt.format(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Separator />

            {/* 3. Payment Information */}
            <Section title="Payment Information" icon={CreditCard}>
              <div className="rounded-lg border border-border bg-muted/30 overflow-hidden divide-y divide-border">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Payment status</span>
                  <IsPaidBadge isPaid={order.is_paid} />
                </div>
                <InfoRow
                  label="Transaction ID"
                  value={<span className="text-muted-foreground italic">N/A</span>}
                />
                <InfoRow
                  label="Method"
                  value={<span className="text-muted-foreground italic">Not recorded</span>}
                />
              </div>
            </Section>

            <Separator />

            {/* 4. Fulfillment / Shipping */}
            <Section title="Fulfillment & Shipping" icon={Truck}>
              <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border overflow-hidden mb-3">
                <InfoRow
                  label="Fulfillment"
                  value={
                    <span className={cn(
                      "font-medium",
                      order.status === "completed" ? "text-status-completed" :
                      order.status === "dispatched" ? "text-status-dispatched" :
                      "text-muted-foreground"
                    )}>
                      {order.status === "completed" ? "Fulfilled" :
                       order.status === "dispatched" ? "Shipped" :
                       order.status === "cancelled" ? "Cancelled" : "Pending"}
                    </span>
                  }
                />
                <InfoRow
                  label="Shipping method"
                  value={<span className="text-muted-foreground italic">Standard shipping</span>}
                />
                <InfoRow
                  label="Tracking"
                  value={<span className="text-muted-foreground italic">No tracking number</span>}
                />
              </div>
              <FulfillmentTimeline status={order.status} />
            </Section>

            <Separator />

            {/* 5. Order Summary */}
            <Section title="Order Summary" icon={ReceiptText}>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Subtotal</span>
                    <span className="text-xs tabular-nums text-foreground">{fmt.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Discount
                    </span>
                    <span className="text-xs tabular-nums text-status-completed">—</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Tax (8%)</span>
                    <span className="text-xs tabular-nums text-foreground">{fmt.format(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Shipping</span>
                    <span className="text-xs tabular-nums text-foreground">
                      {shippingCost === 0 ? (
                        <span className="text-status-completed">Free</span>
                      ) : fmt.format(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-3 bg-muted/40">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {fmt.format(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            <Separator />

            {/* 6. Activity Timeline */}
            <Section title="Activity" icon={Clock}>
              <div className="space-y-1">
                {activityLog.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 py-2">
                      <div className="h-7 w-7 rounded-full border border-border bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className={cn("h-3.5 w-3.5", event.color)} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs font-medium text-foreground">{event.label}</p>
                        <p className="text-xs text-muted-foreground">{formatShort(event.time)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        </ScrollArea>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-card">
          <p className="text-xs text-muted-foreground">
            Last updated {formatShort(order.updated_at)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={isBusy || order.status === "completed" || order.status === "cancelled"}
              onClick={() =>
                runAction("fulfill", () => updateOrderStatusAction(order.id, "completed"))
              }
            >
              {pendingAction === "fulfill" && isBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
              Mark Fulfilled
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
