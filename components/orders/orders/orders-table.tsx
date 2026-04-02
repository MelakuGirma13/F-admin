"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Package,
  X,
  ChevronDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import { OrderStatusBadge, IsPaidBadge } from "./order-status-badge";
import { OrderRowActions } from "./order-row-actions";
import { OrdersFilters } from "./orders-filters";

// Dynamically import the heavy sheet — only needed after user interaction
const OrderDetailSheet = dynamic(
  () => import("./order-detail-sheet").then((m) => m.OrderDetailSheet),
  { ssr: false }
);
import { OrdersPagination } from "./orders-pagination";
import { bulkUpdateStatusAction, bulkMarkPaidAction } from "@/app/actions/orders/orders";
import { SortField, SortDir, Order, OrderStatus, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/types/orders";

// ─── Formatters ──────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d));

// ─── Sort button ─────────────────────────────────────────────────────────────

function SortButton({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  disabled,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  disabled: boolean;
}) {
  const isActive = currentField === field;
  return (
    <button
      className="flex items-center gap-1 group disabled:opacity-50"
      onClick={() => onSort(field)}
      disabled={disabled}
      aria-label={`Sort by ${label}`}
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
        {label}
      </span>
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      )}
    </button>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 10, cols = 9 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}>
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r} className="border-border">
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <div
                    className="h-4 animate-pulse rounded bg-muted"
                    style={{ width: `${60 + ((r * cols + c) % 5) * 15}%` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface OrdersTableProps {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  status: OrderStatus | "ALL";
  isPaid: "all" | "paid" | "unpaid";
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDir: SortDir;
  isLoading?: boolean;
}

// ─── Column helper ────────────────────────────────────────────────────────────

const col = createColumnHelper<Order>();

// ─── Component ───────────────────────────────────────────────────────────────

export function OrdersTable({
  orders,
  total,
  page,
  pageSize,
  totalPages,
  search,
  status,
  isPaid,
  dateFrom,
  dateTo,
  sortField,
  sortDir,
  isLoading = false,
}: OrdersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Server-driven sorting state (controlled externally via URL)
  const sorting: SortingState = [{ id: sortField, desc: sortDir === "desc" }];

  // ── Push sort to URL ──────────────────────────────────────────────────────
  const pushSort = useCallback(
    (field: SortField) => {
      const params = new URLSearchParams(searchParams.toString());
      const newDir: SortDir =
        field === sortField && sortDir === "desc" ? "asc" : "desc";
      params.set("sort", `${field}.${newDir}`);
      params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, sortField, sortDir]
  );

  // ── TanStack columns ──────────────────────────────────────────────────────
  const columns = [
    col.display({
      id: "select",
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          data-state={table.getIsSomePageRowsSelected() ? "indeterminate" : undefined}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="translate-y-px"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select order ${row.original.id}`}
          className="translate-y-px"
        />
      ),
    }),
    col.accessor("order_number", {
      id: "order_number",
      enableHiding: false,
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Order ID
        </span>
      ),
      cell: (info) => (
        <button
          className="font-mono text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
          onClick={() => setDetailOrder(info.row.original)}
        >
          {info.getValue<string>()}
        </button>
      ),
    }),
    // col.accessor("customer", {
    //   header: () => (
    //     <SortButton
    //       label="Customer"
    //       field="customer"
    //       currentField={sortField}
    //       currentDir={sortDir}
    //       onSort={pushSort}
    //       disabled={isPending}
    //     />
    //   ),
    //   cell: (info) => (
    //     <span className="text-sm text-foreground max-w-36 truncate block">
    //       {info.getValue()}
    //     </span>
    //   ),
    // }),
    // col.accessor("email", {
    //   header: () => (
    //     <SortButton
    //       label="Email"
    //       field="email"
    //       currentField={sortField}
    //       currentDir={sortDir}
    //       onSort={pushSort}
    //       disabled={isPending}
    //     />
    //   ),
    //   cell: (info) => (
    //     <span className="text-sm text-muted-foreground max-w-44 truncate block">
    //       {info.getValue()}
    //     </span>
    //   ),
    // }),
    col.accessor("total", {
      header: () => (
        <div className="flex justify-end">
          <SortButton
            label="Total"
            field="total"
            currentField={sortField}
            currentDir={sortDir}
            onSort={pushSort}
            disabled={isPending}
          />
        </div>
      ),
      cell: (info) => (
        <div className="text-sm font-semibold text-foreground text-right tabular-nums">
          {formatCurrency(info.getValue())}
        </div>
      ),
    }),
    col.accessor("status", {
      header: () => (
        <SortButton
          label="Status"
          field="status"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => <OrderStatusBadge status={info.getValue()} />,
    }),
    col.accessor("is_paid", {
      id: "is_paid",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Payment
        </span>
      ),
      cell: (info) => <IsPaidBadge isPaid={info.getValue()} />,
    }),
    col.accessor("order_items", {
      id: "order_items",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center block">
          Items
        </span>
      ),
      cell: (info) => (
        <div className="flex justify-center">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {info.getValue().length}
          </span>
        </div>
      ),
    }),
    col.accessor("created_at", {
      id: "created_at",
      header: () => (
        <SortButton
          label="Date"
          field="created_at"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    col.display({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <OrderRowActions order={row.original} onViewDetails={setDetailOrder} />
      ),
    }),
  ];

  // ── TanStack table instance ───────────────────────────────────────────────
  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    getRowId: (row) => row.id,
    manualSorting: true,    // server-side
    manualPagination: true, // server-side
    pageCount: totalPages,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  // ── Bulk actions ──────────────────────────────────────────────────────────
  function bulkStatus(s: string) {
    if (!ORDER_STATUSES.includes(s as OrderStatus)) return;
    startTransition(async () => {
      const res = await bulkUpdateStatusAction(selectedIds, s as OrderStatus);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          `${selectedIds.length} order${selectedIds.length > 1 ? "s" : ""} moved to "${ORDER_STATUS_LABELS[s as OrderStatus]}".`
        );
        setRowSelection({});
      }
    });
  }

  function bulkPaid(paid: boolean) {
    startTransition(async () => {
      const res = await bulkMarkPaidAction(selectedIds, paid);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          `${selectedIds.length} order${selectedIds.length > 1 ? "s" : ""} marked as ${paid ? "paid" : "unpaid"}.`
        );
        setRowSelection({});
      }
    });
  }

  return (
    <>
      {/* ── Filter toolbar (rendered inside card) ─────────────────────── */}
      <div className="border-b border-border px-5 py-4">
        <OrdersFilters
          search={search}
          status={status}
          isPaid={isPaid}
          dateFrom={dateFrom}
          dateTo={dateTo}
          pageSize={pageSize}
          total={total}
          table={table}
        />
      </div>

      {/* ── Bulk action bar ────────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-border bg-muted/40">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} selected
          </span>
          <div className="flex flex-wrap items-center gap-2 ml-2">
            <Select onValueChange={bulkStatus} disabled={isPending}>
              <SelectTrigger className="h-8 text-xs gap-1 w-40">
                <SelectValue placeholder="Set status" />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {ORDER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={() => bulkPaid(true)}
            >
              Mark paid
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={() => bulkPaid(false)}
            >
              Mark unpaid
            </Button>
          </div>
          {isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-muted-foreground"
            onClick={() => setRowSelection({})}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Table or skeleton ─────────────────────────────────────────── */}
      {isLoading ? (
        <TableSkeleton rows={pageSize} />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Package className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No orders found</p>
          <p className="text-xs">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-0">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={header.id === "select" ? "w-10 pl-5" : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="group border-border hover:bg-muted/40 data-[state=selected]:bg-primary/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === "select" ? "pl-5" : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────── */}
      <div className="border-t border-border px-5 py-4">
        <OrdersPagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
        />
      </div>

      {/* ── Detail sheet ──────────────────────────────────────────────── */}
      <OrderDetailSheet
        order={detailOrder}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </>
  );
}
