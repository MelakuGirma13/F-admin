"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import dynamic from "next/dynamic";
import { ProductsFilters } from "./products-filters";
import { ProductsPagination } from "./products-pagination";
import {
  bulkUpdateActiveStatusAction,
  bulkUpdateFeaturedAction,
  bulkDeleteProductsAction,
} from "@/app/actions/products/products";
import {
  Product,
  SortField,
  SortDir,
  PRODUCT_ACTIVE_OPTIONS,
  PRODUCT_FEATURED_OPTIONS,
} from "@/types/products";
import { gooeyToast } from "@/components/ui/goey-toaster";


// const ProductDetailSheet = dynamic(
//   () => import("./product-detail-sheet").then((m) => m.ProductDetailSheet),
//   { ssr: false }
// );

// ─── Formatters ──────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d));

const formatRating = (rating: number | null | undefined) => {
  if (rating === null || rating === undefined) return "—";
  return rating.toFixed(1);
};

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
      className="group flex items-center gap-1 disabled:opacity-50"
      onClick={() => onSort(field)}
      disabled={disabled}
      aria-label={`Sort by ${label}`}
    >
      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-foreground">
        {label}
      </span>
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      )}
    </button>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function FeaturedBadge({ isFeatured }: { isFeatured: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isFeatured
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {isFeatured ? "Featured" : "Standard"}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 10, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
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

interface ProductsTableProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  isActive: "all" | "active" | "inactive";
  isFeatured: "all" | "featured" | "not-featured";
  categoryId: string;
  priceMin: string;
  priceMax: string;
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDir: SortDir;
  categories: { id: string; name: string }[];
  isLoading?: boolean;
}

// ─── Column helper ────────────────────────────────────────────────────────────

const col = createColumnHelper<Product>();

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductsTable({
  products,
  total,
  page,
  pageSize,
  totalPages,
  search,
  isActive,
  isFeatured,
  categoryId,
  priceMin,
  priceMax,
  dateFrom,
  dateTo,
  sortField,
  sortDir,
  categories,
  isLoading = false,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const sorting: SortingState = [{ id: sortField, desc: sortDir === "desc" }];

  const pushSort = useCallback(
    (field: SortField) => {
      const params = new URLSearchParams(searchParams.toString());
      const newDir: SortDir = field === sortField && sortDir === "desc" ? "asc" : "desc";
      params.set("sort", `${field}.${newDir}`);
      params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, sortField, sortDir]
  );

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
          aria-label={`Select product ${row.original.id}`}
          className="translate-y-px"
        />
      ),
    }),
    col.accessor("name", {
      id: "name",
      enableHiding: false,
      header: () => (
        <SortButton
          label="Product"
          field="name"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => (
        <button
          className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
          onClick={() => setDetailProduct(info.row.original)}
        >
          {info.getValue()}
        </button>
      ),
    }),
    col.accessor("company", {
      header: () => (
        <SortButton
          label="Company"
          field="company"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => (
        <span className="text-sm text-muted-foreground max-w-36 truncate block">
          {info.getValue()}
        </span>
      ),
    }),
    col.accessor("base_price", {
      header: () => (
        <div className="flex justify-end">
          <SortButton
            label="Price"
            field="base_price"
            currentField={sortField}
            currentDir={sortDir}
            onSort={pushSort}
            disabled={isPending}
          />
        </div>
      ),
      cell: (info) => (
        <div className="text-right text-sm font-semibold text-foreground tabular-nums">
          {formatCurrency(info.getValue())}
        </div>
      ),
    }),
    col.accessor("is_active", {
      header: () => (
        <SortButton
          label="Status"
          field="is_active"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => <ActiveBadge isActive={info.getValue()} />,
    }),
    col.accessor("is_featured", {
      header: () => (
        <SortButton
          label="Featured"
          field="is_featured"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => <FeaturedBadge isFeatured={info.getValue()} />,
    }),
    col.accessor("categories", {
      id: "categories",
      header: () => (
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Categories
        </span>
      ),
      cell: (info) => {
        const cats = info.getValue();
        if (!cats || cats.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {cats.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className="inline-flex rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {cat.name}
              </span>
            ))}
            {cats.length > 2 && (
              <span className="text-xs text-muted-foreground">+{cats.length - 2}</span>
            )}
          </div>
        );
      },
    }),
    col.accessor("averageRating", {
      id: "averageRating",
      header: () => (
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Rating
        </span>
      ),
      cell: (info) => {
        const rating = info.getValue();
        const avg = rating?.average_rating;
        const count = rating?.review_count;
        return (
          <div className="text-sm">
            {avg ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {formatRating(avg)} ★
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
            {count !== null &&count !== undefined && count > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({count})</span>
            )}
          </div>
        );
      },
    }),
    col.accessor("created_at", {
      id: "created_at",
      header: () => (
        <SortButton
          label="Created"
          field="created_at"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {formatDate(info.getValue().toString())}
        </span>
      ),
    }),
    col.display({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <ProductRowActions product={row.original} onViewDetails={setDetailProduct} />
      ),
    }),
  ];

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    getRowId: (row) => row.id,
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const bulkSetActive = (active: boolean) => {
    startTransition(async () => {
      const res = await bulkUpdateActiveStatusAction(selectedIds, active);
      if (res.error) {
        gooeyToast.error("", { description: res.error });
      } else {
        gooeyToast.success("Status updated.", {
          description: `${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""} marked as ${active ? "active" : "inactive"}.`,
        });
        setRowSelection({});
      }
    });
  };

  const bulkSetFeatured = (featured: boolean) => {
    startTransition(async () => {
      const res = await bulkUpdateFeaturedAction(selectedIds, featured);
      if (res.error) {
        gooeyToast.error("", { description: res.error });
      } else {
        gooeyToast.success("Featured status updated.", {
          description: `${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""} ${featured ? "featured" : "unfeatured"}.`,
        });
        setRowSelection({});
      }
    });
  };

  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.length} product(s)? This action cannot be undone.`)) return;
    startTransition(async () => {
      const res = await bulkDeleteProductsAction(selectedIds);
      if (res.error) {
        gooeyToast.error("", { description: res.error });
      } else {
        gooeyToast.success("Products deleted.", {
          description: `${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""} removed.`,
        });
        setRowSelection({});
      }
    });
  };

  return (
    <>
      <div className="border-b border-border px-5 py-4">
        <ProductsFilters
          search={search}
          isActive={isActive}
          isFeatured={isFeatured}
          categoryId={categoryId}
          priceMin={priceMin}
          priceMax={priceMax}
          dateFrom={dateFrom}
          dateTo={dateTo}
          pageSize={pageSize}
          total={total}
          table={table}
          categories={categories}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} selected
          </span>
          <div className="ml-2 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={() => bulkSetActive(true)}
            >
              Set active
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={() => bulkSetActive(false)}
            >
              Set inactive
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={() => bulkSetFeatured(true)}
            >
              Set featured
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={() => bulkSetFeatured(false)}
            >
              Remove featured
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              disabled={isPending}
              onClick={bulkDelete}
            >
              Delete
            </Button>
          </div>
          {isPending && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 text-muted-foreground"
            onClick={() => setRowSelection({})}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={pageSize} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Package className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-0 hover:bg-transparent">
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
                  className="group border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5"
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

      <div className="border-t border-border px-5 py-4">
        <ProductsPagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
        />
      </div>

      {/* <ProductDetailSheet
        product={detailProduct}
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
      /> */}
    </>
  );
}

// ─── Row Actions Component (inline or separate) ──────────────────────────────

function ProductRowActions({
  product,
  onViewDetails,
}: {
  product: Product;
  onViewDetails: (product: Product) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    router.push(`/admin/products/${product.id}/edit`);
  };
  const handleDetail = () => {
    router.push(`/admin/products/${product.id}/detail`);
  };
  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    startTransition(async () => {
      const { deleteProductAction } = await import("@/app/actions/products/products");
      const res = await deleteProductAction(product.id);
      if (res.error) {
        gooeyToast.error("", { description: res.error });
      } else {
        gooeyToast.success("Product deleted.", { description: `${product.name} removed.` });
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        //onClick={() => onViewDetails(product)}
        onClick={handleDetail}
        aria-label="View details"
      >
        <Package className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleEdit}
        aria-label="Edit product"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M17 3l4 4-7 7H10v-4l7-7z" />
          <path d="M4 20h16" />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive/70 hover:text-destructive"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Delete product"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 7h16" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
            <path d="M9 4h6" />
          </svg>
        )}
      </Button>
    </div>
  );
}