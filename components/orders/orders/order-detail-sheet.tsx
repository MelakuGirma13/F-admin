"use client"

import { useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderStatusBadge, IsPaidBadge } from "./order-status-badge"
import type { Order, OrderStatus } from "@/types/orders"
import {
  toggleOrderPaidAction,
  updateOrderStatusAction,
  cancelOrderAction,
} from "@/app/actions/orders/orders"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { gooeyToast } from "@/components/ui/goey-toaster"
import { MeasurmentDisplayDialog } from "../measurment-display-dialog"

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

const formatShort = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={copy}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check className="text-status-completed h-3.5 w-3.5" />
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
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

// ─── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono,
  copyValue,
  href,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyValue?: string
  href?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-right text-xs text-foreground",
          mono && "font-mono"
        )}
      >
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
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
  )
}

// ─── Fulfillment timeline ─────────────────────────────────────────────────────

type TimelineStep = {
  key: OrderStatus
  label: string
  description: string
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    key: "ORDER_PLACED",
    label: "Order Placed",
    description: "Order received and confirmed",
  },
  {
    key: "PROCESSING",
    label: "Processing",
    description: "Items being prepared",
  },
  {
    key: "DISPATCHED",
    label: "Dispatched",
    description: "Package handed to carrier",
  },
  {
    key: "COMPLETED",
    label: "Delivered",
    description: "Order delivered to customer",
  },
]

const STATUS_STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  PENDING: -1,
  ORDER_PLACED: 0,
  PROCESSING: 1,
  DISPATCHED: 2,
  COMPLETED: 3,
  CANCELLED: -2,
}

function FulfillmentTimeline({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_STEP_INDEX[status] ?? -1
  const isCancelled = status === "CANCELLED"

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        <span className="text-sm font-medium text-destructive">
          Order cancelled
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        const upcoming = idx > currentIdx
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                  done && "border-status-completed bg-status-completed/10",
                  active && "border-status-placed bg-status-placed/10",
                  upcoming && "border-border bg-muted/40"
                )}
              >
                {done ? (
                  <CheckCircle2 className="text-status-completed h-3.5 w-3.5" />
                ) : active ? (
                  <Circle className="text-status-placed fill-status-placed h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3 text-border" />
                )}
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-6 w-0.5",
                    done ? "bg-status-completed/40" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="pt-0.5 pb-1">
              <p
                className={cn(
                  "text-xs font-medium",
                  upcoming ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────

type ActivityEvent = {
  label: string
  time: string
  icon: React.ElementType
  color: string
}

function buildActivityLog(order: Order): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      label: "Order placed",
      time: order.created_at,
      icon: ShoppingBag,
      color: "text-status-placed",
    },
  ]
  if (order.is_paid) {
    events.push({
      label: "Payment confirmed",
      time: order.updated_at,
      icon: CreditCard,
      color: "text-status-completed",
    })
  }
  if (order.status === "PROCESSING") {
    events.push({
      label: "Order processing started",
      time: order.updated_at,
      icon: Package,
      color: "text-status-processing",
    })
  }
  if (order.status === "DISPATCHED") {
    events.push({
      label: "Order dispatched",
      time: order.updated_at,
      icon: Truck,
      color: "text-status-dispatched",
    })
  }
  if (order.status === "COMPLETED") {
    events.push({
      label: "Order delivered",
      time: order.updated_at,
      icon: CheckCircle2,
      color: "text-status-completed",
    })
  }
  if (order.status === "CANCELLED") {
    events.push({
      label: "Order cancelled",
      time: order.updated_at,
      icon: XCircle,
      color: "text-destructive-foreground",
    })
  }
  return events.reverse()
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function OrderDetailSheetSkeleton({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-[560px]">
        <div className="animate-pulse space-y-3 border-b border-border px-6 pt-6 pb-4">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        </div>
        <div className="flex-1 animate-pulse space-y-6 px-6 py-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderDetailSheetProps {
  order: Order | null
  open: boolean
  onClose: () => void
}

export function OrderDetailSheet({
  order,
  open,
  onClose,
}: OrderDetailSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  if (!order) return null

  const subtotal = order.order_items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  )

  const taxAmount = order.tax
  const shippingCost = order.shipping
  const activityLog = buildActivityLog(order)

  const runAction = (key: string, fn: () => Promise<{ error?: string }>) => {
    setPendingAction(key)
    startTransition(async () => {
      const res = await fn()
      setPendingAction(null)
      if (res.error)
        gooeyToast.error("", {
          description: res.error,
        })
      else gooeyToast.success("Order updated.")
    })
  }

  const isBusy = isPending

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full max-w-none flex-col gap-0 p-0 sm:w-[95vw] [&>button]:top-5 [&>button]:right-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader className="shrink-0 border-b border-border px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-mono text-sm font-semibold tracking-tight text-foreground">
                  {order.order_number}
                </SheetTitle>
                <CopyButton value={order.order_number} label="Order Number" />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
            {/* <Button
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
              className="h-8 gap-1.5 text-xs"
              disabled={isBusy || order.is_paid}
              onClick={() =>
                runAction("refund", () =>
                  toggleOrderPaidAction(order.id, false)
                )
              }
            >
              {pendingAction === "refund" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Refund
            </Button>*/}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={
                isBusy ||
                order.status === "COMPLETED" ||
                order.status === "CANCELLED"
              }
              onClick={() =>
                runAction("fulfill", () =>
                  updateOrderStatusAction(order.id, "COMPLETED")
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
              className="text-destructive-foreground hover:text-destructive-foreground h-8 gap-1.5 border-destructive/30 text-xs hover:bg-destructive/10"
              disabled={isBusy || order.status === "CANCELLED"}
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

        <ScrollArea className="min-h-0 flex-1">
          <ScrollBar orientation="horizontal" />
          <div className="space-y-7 px-6 py-5">
            {/* 1. Customer Information */}
            <Section title="Customer Information" icon={User}>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-semibold text-foreground">
                      {order.customer
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.customer}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      {order.email}
                    </p>
                  </div>
                  <CopyButton value={order.email} label="email" />
                </div>
                {/* <InfoRow label="Phone" value={<span className="text-muted-foreground italic">Not provided</span>} />
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground italic">No address on file</div>
                  </div>
                </div> */}
              </div>
            </Section>

            <Separator />

            {/* 2. Order Items */}
            <Section
              title={`Order Items (${order.order_items.length})`}
              icon={ShoppingBag}
            >
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="max-h-[50vh] divide-y divide-border overflow-y-auto">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex w-full items-center gap-3 p-3"
                    >
                      {/* Image / Placeholder */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
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

                      {/* Item details */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {item.sku && (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1.5 py-0 font-mono text-[10px]"
                            >
                              {item.sku}
                            </Badge>
                          )}
                          <span className="text-xs whitespace-nowrap text-muted-foreground">
                            Qty {item.qty} &times; {fmt.format(item.price)} |{" "}
                            {item.size}
                          </span>
                        
                        </div>

                        {/* Total price */}
                        <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                          {fmt.format(item.price * item.qty)}
                        </span>
                        <br/>
  <span>{item.custom_order_id && ( <MeasurmentDisplayDialog customOrderId={item.custom_order_id}/>)}</span>
                      
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Separator />

            {/* 3. Payment Information */}
            <Section title="Payment Information" icon={CreditCard}>
              <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Payment
                  </span>
                  <IsPaidBadge isPaid={order.is_paid} />
                </div>

                {/* Content */}
                <div className="divide-y">
                  <InfoRow
                    label="Square Order ID"
                    value={
                      order.square_order_id ? (
                        <span className="truncate">
                          {order.square_order_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Not available
                        </span>
                      )
                    }
                    mono
                    copyValue={order.square_order_id ?? undefined}
                  />

                  <InfoRow
                    label="Payment Link ID"
                    value={
                      order.payment_link_id ? (
                        <span className="truncate">
                          {order.payment_link_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Not available
                        </span>
                      )
                    }
                    mono
                    copyValue={order.payment_link_id ?? undefined}
                  />
                </div>
              </div>
            </Section>

            <Separator />

            {/* 4.  Shipping */}
            {/* <Section title="Shipping" icon={Truck}>
              <FulfillmentTimeline status={order.status} />
            </Section><Separator /> */}

            {/* 5. Order Summary */}
            <Section title="Order Summary" icon={ReceiptText}>
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="text-xs text-foreground tabular-nums">
                      {fmt.format(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Tax</span>
                    <span className="text-xs text-foreground tabular-nums">
                      {fmt.format(taxAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      Shipping
                    </span>
                    <span className="text-xs text-foreground tabular-nums">
                      {shippingCost === 0 ? (
                        <span className="text-status-completed">Free</span>
                      ) : (
                        fmt.format(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 px-3 py-3">
                    <span className="text-sm font-semibold text-foreground">
                      Total
                    </span>
                    <span className="text-base font-bold text-foreground tabular-nums">
                      {fmt.format(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            <Separator />

            {/* 6. Activity Timeline */}
            {/* <Section title="Activity" icon={Clock}>
              <div className="space-y-1">
                {activityLog.map((event, idx) => {
                  const Icon = event.icon
                  return (
                    <div key={idx} className="flex items-start gap-3 py-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                        <Icon className={cn("h-3.5 w-3.5", event.color)} />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {event.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatShort(event.time)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section> */}
          </div>
        </ScrollArea>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
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
              className="h-8 gap-1.5 text-xs"
              disabled={
                isBusy ||
                order.status === "COMPLETED" ||
                order.status === "CANCELLED"
              }
              onClick={() =>
                runAction("fulfill", () =>
                  updateOrderStatusAction(order.id, "COMPLETED")
                )
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
  )
}
