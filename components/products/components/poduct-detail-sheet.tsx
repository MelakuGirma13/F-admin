

"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
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
  Copy,
  Check,
  Star,
  Package,
  Tag,
  Ruler,
  Layers,
  ImageIcon,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  StarOff,
  Loader2,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Product } from "@/types/products"
import {
  toggleProductFeaturedAction,
  toggleProductActiveAction,
} from "@/app/actions/products/products"

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date instanceof Date ? date : new Date(date));

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
              <Check className="h-3.5 w-3.5 text-green-600" />
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

// ─── Section wrapper ─────────────────────────────────────────────────────────

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

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono,
  copyValue,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyValue?: string
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
        {value}
        {copyValue && <CopyButton value={copyValue} label={label} />}
      </span>
    </div>
  )
}

// ─── Active Price Display ────────────────────────────────────────────────────

function ActivePriceInfo({ product }: { product: Product }) {
  const now = new Date()
  const activePrice = product.prices?.find(
    (p) =>
      p.is_active &&
      (!p.start_date || new Date(p.start_date) <= now) &&
      (!p.end_date || new Date(p.end_date) >= now)
  )

  const displayPrice = activePrice ? activePrice.price : product.base_price

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">Current price</span>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {fmt.format(displayPrice)}
        </span>
      </div>
      {activePrice && activePrice.type !== "STANDARD" && (
        <Badge variant="outline" className="text-xs">
          {activePrice.name || activePrice.type}
        </Badge>
      )}
      {product.prices && product.prices.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {product.prices.length} price rules configured
        </p>
      )}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function ProductDetailSheetSkeleton({
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-20 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ProductDetailSheetProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onProductUpdated?: () => void // optional refetch callback
}

export function ProductDetailSheet({
  product,
  open,
  onClose,
  onProductUpdated,
}: ProductDetailSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  if (!product) return null

  const runAction = (key: string, fn: () => Promise<{ error?: string }>) => {
    setPendingAction(key)
    startTransition(async () => {
      const res = await fn()
      setPendingAction(null)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Product updated.")
        onProductUpdated?.()
      }
    })
  }

  const isBusy = isPending

  // Helper data
  const mainImage = product.images?.find((img) => img.is_main_image) || product.images?.[0]
  const averageRating = product.averageRating?.average_rating ?? null
  const reviewCount = product.averageRating?.review_count ?? 0

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full max-w-none flex-col gap-0 p-0 sm:w-[95vw] [&>button]:top-5 [&>button]:right-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader className="shrink-0 border-b border-border px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-mono text-sm font-semibold tracking-tight text-foreground">
                  {product.id.slice(0, 8)}...
                </SheetTitle>
                <CopyButton value={product.id} label="Product ID" />
              </div>
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                Created {formatDate(product.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {product.is_featured ? (
              <Badge variant="link" className="gap-1">
                <Star className="h-3 w-3" /> Featured
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <StarOff className="h-3 w-3" /> Not featured
              </Badge>
            )}
            {product.is_active ? (
              <Badge variant="default" className="gap-1">
                <ToggleRight className="h-3 w-3" /> Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <ToggleLeft className="h-3 w-3" /> Inactive
              </Badge>
            )}
            {product.is_custom && (
              <Badge variant="outline" className="gap-1">
                <Layers className="h-3 w-3" /> Custom enabled
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={isBusy}
              onClick={() =>
                runAction("toggleFeatured", () =>
                  toggleProductFeaturedAction(product.id, !product.is_featured)
                )
              }
            >
              {pendingAction === "toggleFeatured" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : product.is_featured ? (
                <StarOff className="h-3.5 w-3.5" />
              ) : (
                <Star className="h-3.5 w-3.5" />
              )}
              {product.is_featured ? "Unfeature" : "Feature"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={isBusy}
              onClick={() =>
                runAction("toggleActive", () =>
                  toggleProductActiveAction(product.id, !product.is_active)
                )
              }
            >
              {pendingAction === "toggleActive" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : product.is_active ? (
                <Archive className="h-3.5 w-3.5" />
              ) : (
                <ArchiveRestore className="h-3.5 w-3.5" />
              )}
              {product.is_active ? "Archive" : "Restore"}
            </Button>
          </div>
        </SheetHeader>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <ScrollArea className="min-h-0 flex-1">
          <ScrollBar orientation="horizontal" />
          <div className="space-y-7 px-6 py-5">
            {/* 1. Product Info */}
            <Section title="Product Information" icon={Package}>
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <InfoRow label="Name" value={product.name} copyValue={product.name} />
                <InfoRow label="Company" value={product.company} />
                <div className="px-4 py-2.5">
                  <div className="text-xs text-muted-foreground mb-1">Description</div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {product.description || "No description provided."}
                  </p>
                </div>
              </div>
            </Section>

            <Separator />

            {/* 2. Pricing */}
            <Section title="Pricing" icon={DollarSign}>
              <div className="overflow-hidden rounded-lg border border-border bg-card p-4">
                <ActivePriceInfo product={product} />
                <div className="mt-3 pt-3 border-t border-border">
                  <InfoRow
                    label="Base price"
                    value={fmt.format(product.base_price)}
                  />
                  {product.prices && product.prices.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Other price rules
                      </p>
                      <div className="space-y-1">
                        {product.prices
                          .filter((p) => p.type !== "STANDARD")
                          .map((price) => (
                            <div
                              key={price.id}
                              className="flex justify-between text-xs"
                            >
                              <span>
                                {price.name || price.type}
                                {price.min_quantity && ` (min ${price.min_quantity})`}
                              </span>
                              <span className="font-mono">
                                {fmt.format(price.price)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Separator />

            {/* 3. Images */}
            <Section title="Images" icon={ImageIcon}>
              <div className="rounded-lg border border-border overflow-hidden">
                {mainImage ? (
                  <div className="relative aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mainImage.image_url}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 p-2 overflow-x-auto border-t border-border">
                    {product.images.map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={img.image_url}
                        alt=""
                        className="h-12 w-12 rounded-md object-cover border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Separator />

            {/* 4. Sizes & Inventory */}
            <Section title="Sizes & Stock" icon={Ruler}>
              <div className="rounded-lg border border-border divide-y">
                {product.sizes && product.sizes.length > 0 ? (
                  product.sizes.map((size) => (
                    <div
                      key={size.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{size.size}</span>
                        {size.price_modifier > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{fmt.format(size.price_modifier)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={size.quantity > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {size.quantity > 0 ? `${size.quantity} in stock` : "Out of stock"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No sizes defined
                  </div>
                )}
              </div>
            </Section>

            <Separator />

            {/* 5. Materials & Categories */}
            <div className="grid gap-6 md:grid-cols-2">
              <Section title="Materials" icon={Layers}>
                <div className="rounded-lg border border-border p-3">
                  {product.material && product.material.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {product.material.map((mat) => (
                        <Badge key={mat.id} variant="secondary">
                          {mat.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No materials listed</p>
                  )}
                </div>
              </Section>

              <Section title="Categories" icon={Tag}>
                <div className="rounded-lg border border-border p-3">
                  {product.categories && product.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {product.categories.map((cat) => (
                        <Badge key={cat.id} variant="outline">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No categories assigned</p>
                  )}
                </div>
              </Section>
            </div>

            <Separator />

            {/* 6. Ratings */}
            <Section title="Customer Ratings" icon={Star}>
              <div className="rounded-lg border border-border p-4">
                {averageRating !== null ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      from {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews yet</p>
                )}
              </div>
            </Section>
          </div>
        </ScrollArea>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Last updated {formatDate(product.updated_at)}
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}