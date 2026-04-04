import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { getOrders, getOrderCountByStatus } from "@/lib/orders"
import { Button } from "@/components/ui/button"
import { Package, Plus } from "lucide-react"
import type { OrderStatus, SortField, SortDir } from "@/types/orders"
import { OrdersTable } from "@/components/orders/orders/orders-table"

export const metadata: Metadata = {
  title: "Orders | Admin Dashboard",
  description: "Manage and review customer orders",
}

export const dynamic = "force-dynamic"

// ─── Validation constants ─────────────────────────────────────────────────────

const VALID_PAGE_SIZES = new Set([10, 20, 50, 100])
const DEFAULT_PAGE_SIZE = 10

const VALID_STATUSES = new Set<string>([
  "PENDING",
  "ORDER_PLACED",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
])

const VALID_SORT_FIELDS = new Set<string>([
  "created_at",
  "total",
  "status",
  "customer",
  "email",
])

// ─── Page ─────────────────────────────────────────────────────────────────────

interface OrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const OrdersPage = async ({
  searchParams,
}: OrdersPageProps): Promise<React.ReactElement> => {
  const params = await searchParams

  // ── Parse URL params ──
  const search = typeof params.search === "string" ? params.search.trim() : ""

  const rawStatus = typeof params.status === "string" ? params.status : ""
  const status: OrderStatus | "ALL" =
    rawStatus && VALID_STATUSES.has(rawStatus)
      ? (rawStatus as OrderStatus)
      : "ALL"

  const rawIsPaid = typeof params.isPaid === "string" ? params.isPaid : "all"
  const isPaid: "all" | "paid" | "unpaid" =
    rawIsPaid === "paid" || rawIsPaid === "unpaid" ? rawIsPaid : "all"

  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : ""
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : ""

  const page =
    typeof params.page === "string"
      ? Math.max(1, parseInt(params.page, 10) || 1)
      : 1

  const rawPageSize =
    typeof params.pageSize === "string"
      ? parseInt(params.pageSize, 10)
      : DEFAULT_PAGE_SIZE
  const pageSize = VALID_PAGE_SIZES.has(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE

  // sort=<field>.<dir> e.g. "created_at.desc"
  const rawSort = typeof params.sort === "string" ? params.sort : ""
  const [rawField, rawDir] = rawSort.split(".")
  const sortField: SortField = VALID_SORT_FIELDS.has(rawField)
    ? (rawField as SortField)
    : "created_at"
  const sortDir: SortDir = rawDir === "asc" ? "asc" : "desc"

  // ── Fetch data ──
  let result
  let completedCount = 0
  let pendingCount = 0
  let cancelledCount = 0
  let fetchError: string | null = null

  try {
    ;[result, completedCount, pendingCount, cancelledCount] =
      await Promise.all([
        getOrders({
          search,
          status,
          isPaid,
          dateFrom,
          dateTo,
          sortField,
          sortDir,
          page,
          pageSize,
        }),
        getOrderCountByStatus("COMPLETED"),
        getOrderCountByStatus("PENDING"),
        getOrderCountByStatus("CANCELLED"),
      ])
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load orders."
    result = { orders: [], total: 0, page: 1, pageSize, totalPages: 1 }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Orders
              </h1>
            </div>
            <p className="pl-12 text-sm text-muted-foreground">
              View and manage all customer orders across your store.
            </p>
          </div>
          {/* <Link href="/orders/create">
            <Button size="sm" className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link> */}
        </header>

        {/* Error state */}
        {fetchError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {fetchError}
          </div>
        )}

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Orders" value={result.total} />
          <StatCard
            label="Completed"
            value={completedCount}
            accent="completed"
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            accent="Pending"
          />
          <StatCard
            label="Cancelled"
            value={cancelledCount}
            accent="cancelled"
          />
        </div>

        {/* Main Card — filters, table, and pagination are all inside OrdersTable */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Suspense fallback={<OrdersTableSkeleton pageSize={pageSize} />}>
            <OrdersTable
              orders={result.orders}
              total={result.total}
              page={result.page}
              pageSize={result.pageSize}
              totalPages={result.totalPages}
              search={search}
              status={status}
              isPaid={isPaid}
              dateFrom={dateFrom}
              dateTo={dateTo}
              sortField={sortField}
              sortDir={sortDir}
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

export default OrdersPage

// ─── Stat card ────────────────────────────────────────────────────────────────

const ACCENT_CLASSES: Record<string, string> = {
  completed: "text-status-completed",
  processing: "text-status-processing",
  cancelled: "text-status-cancelled",
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`text-2xl font-bold tabular-nums ${
          accent ? ACCENT_CLASSES[accent] : "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}

// ─── Suspense fallback ────────────────────────────────────────────────────────

function OrdersTableSkeleton({ pageSize }: { pageSize: number }) {
  return (
    <div className="space-y-4 p-5">
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <div className="h-9 max-w-sm flex-1 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      {/* Rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  )
}
