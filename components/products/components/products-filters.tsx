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
import type { Table } from "@tanstack/react-table";
import type { Product } from "@/types/products";
import { Calendar } from "@/components/ui/calendar";

const ACTIVE_OPTIONS = [
  { value: "all", label: "All Products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const FEATURED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "not-featured", label: "Not Featured" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const COLUMN_LABELS: Record<string, string> = {
  name: "Product Name",
  company: "Company",
  base_price: "Base Price",
  is_active: "Status",
  is_featured: "Featured",
  created_at: "Created Date",
  categories: "Categories",
  averageRating: "Rating",
  description: "Description",
};

interface ProductsFiltersProps {
  search: string;
  isActive: "all" | "active" | "inactive";
  isFeatured: "all" | "featured" | "not-featured";
  categoryId: string; // "all" or specific category id
  priceMin: string;
  priceMax: string;
  dateFrom: string;
  dateTo: string;
  pageSize: number;
  total: number;
  table: Table<Product>;
  categories: { id: string; name: string }[];
}

export function ProductsFilters({
  search,
  isActive,
  isFeatured,
  categoryId,
  priceMin,
  priceMax,
  dateFrom,
  dateTo,
  pageSize,
  total,
  table,
  categories,
}: ProductsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // --- Debounced search ---
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // --- Debounced price min/max ---
  const [localPriceMin, setLocalPriceMin] = useState(priceMin);
  const [localPriceMax, setLocalPriceMax] = useState(priceMax);
  const priceMinDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalPriceMin(priceMin);
  }, [priceMin]);
  useEffect(() => {
    setLocalPriceMax(priceMax);
  }, [priceMax]);

  function handlePriceMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setLocalPriceMin(value);
    if (priceMinDebounce.current) clearTimeout(priceMinDebounce.current);
    priceMinDebounce.current = setTimeout(() => {
      pushParams({ priceMin: value, page: "1" });
    }, 500);
  }

  function handlePriceMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setLocalPriceMax(value);
    if (priceMaxDebounce.current) clearTimeout(priceMaxDebounce.current);
    priceMaxDebounce.current = setTimeout(() => {
      pushParams({ priceMax: value, page: "1" });
    }, 500);
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
        if (v && v !== "all" && v !== "") {
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

  function handleIsActive(value: string) {
    pushParams({ isActive: value, page: "1" });
  }

  function handleIsFeatured(value: string) {
    pushParams({ isFeatured: value, page: "1" });
  }

  function handleCategory(value: string) {
    pushParams({ categoryId: value, page: "1" });
  }

  function handlePageSize(value: string) {
    pushParams({ pageSize: value, page: "1" });
  }

  function handleReset() {
    setLocalSearch("");
    setLocalPriceMin("");
    setLocalPriceMax("");
    setDateRange(undefined);
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters =
    search ||
    isActive !== "all" ||
    isFeatured !== "all" ||
    categoryId !== "all" ||
    priceMin ||
    priceMax ||
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
            placeholder="Search by name, company..."
            className="pl-9 h-9 bg-background"
            disabled={isPending}
            aria-label="Search products"
          />
        </div>

        {/* Active Status */}
        <Select
          value={isActive}
          onValueChange={handleIsActive}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-36 bg-background" aria-label="Filter by active status">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Featured */}
        <Select
          value={isFeatured}
          onValueChange={handleIsFeatured}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-36 bg-background" aria-label="Filter by featured">
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            {FEATURED_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={categoryId}
          onValueChange={handleCategory}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-40 bg-background" aria-label="Filter by category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            placeholder="Min price"
            value={localPriceMin}
            onChange={handlePriceMinChange}
            className="h-9 w-28 bg-background"
            disabled={isPending}
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            step="0.01"
            placeholder="Max price"
            value={localPriceMax}
            onChange={handlePriceMaxChange}
            className="h-9 w-28 bg-background"
            disabled={isPending}
            aria-label="Maximum price"
          />
        </div>

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
            {total.toLocaleString()} {total === 1 ? "product" : "products"}
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