"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, CalendarRange, SlidersHorizontal, X, Loader2 } from "lucide-react";
import type { OrderStatus } from "@/types/orders";
import type { Table } from "@tanstack/react-table";
import type { Order } from "@/types/orders";
import { Calendar } from "@/components/ui/calendar";

const STATUS_OPTIONS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "placed", label: "Order Placed" },
  { value: "processing", label: "Processing" },
  { value: "dispatched", label: "Dispatched" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAID_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const COLUMN_LABELS: Record<string, string> = {
  customer: "Customer",
  email: "Email",
  total: "Total",
  status: "Status",
  is_paid: "Payment",
  order_items: "Items",
  created_at: "Date",
};

interface OrdersFiltersProps {
  search: string;
  status: OrderStatus | "ALL";
  isPaid: "all" | "paid" | "unpaid";
  dateFrom: string;
  dateTo: string;
  pageSize: number;
  total: number;
  table: Table<Order>;
}

export function OrdersFilters({
  search,
  status,
  isPaid,
  dateFrom,
  dateTo,
  pageSize,
  total,
  table,
}: OrdersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // --- Debounced search ---
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local search in sync with URL (e.g. on reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value, page: "1" });
    }, 350);
  }

  // --- Date range ---
  const initialRange: DateRange | undefined =
    dateFrom || dateTo
      ? {
          from: dateFrom ? new Date(dateFrom) : undefined,
          to: dateTo ? new Date(dateTo) : undefined,
        }
      : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange);
  const [calOpen, setCalOpen] = useState(false);

  function handleDateSelect(range: DateRange | undefined) {
    setDateRange(range);
    if (range?.from && range?.to) {
      pushParams({
        dateFrom: format(range.from, "yyyy-MM-dd"),
        dateTo: format(range.to, "yyyy-MM-dd"),
        page: "1",
      });
      setCalOpen(false);
    }
  }

  const dateLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : dateRange?.from
      ? format(dateRange.from, "MMM d, yyyy")
      : "Pick date range";

  // --- Helpers ---
  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v && v !== "ALL" && v !== "all") {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  function handleStatus(value: string) {
    pushParams({ status: value, page: "1" });
  }

  function handleIsPaid(value: string) {
    pushParams({ isPaid: value, page: "1" });
  }

  function handlePageSize(value: string) {
    pushParams({ pageSize: value, page: "1" });
  }

  function handleReset() {
    setLocalSearch("");
    setDateRange(undefined);
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters =
    search ||
    status !== "ALL" ||
    isPaid !== "all" ||
    dateFrom ||
    dateTo;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search order ID, customer, email..."
            className="pl-9 h-9 bg-background"
            disabled={isPending}
            aria-label="Search orders"
          />
        </div>

        {/* Status */}
        <Select
          value={status}
          onValueChange={handleStatus}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-40 bg-background" aria-label="Filter by status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment */}
        <Select
          value={isPaid}
          onValueChange={handleIsPaid}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-36 bg-background" aria-label="Filter by payment">
            <SelectValue placeholder="All Payments" />
          </SelectTrigger>
          <SelectContent>
            {PAID_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 font-normal text-sm"
              disabled={isPending}
            >
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span className={dateRange?.from ? "text-foreground" : "text-muted-foreground"}>
                {dateLabel}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              initialFocus
            />
            {dateRange && (
              <div className="border-t border-border p-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setDateRange(undefined);
                    pushParams({ dateFrom: "", dateTo: "", page: "1" });
                    setCalOpen(false);
                  }}
                >
                  Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-normal">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Toggle columns
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  className="text-sm"
                >
                  {COLUMN_LABELS[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        )}

        {/* Row count + page size (pushed right) */}
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            {total.toLocaleString()} {total === 1 ? "order" : "orders"}
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="hidden sm:inline shrink-0">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={handlePageSize}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-16 text-xs border-border bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
