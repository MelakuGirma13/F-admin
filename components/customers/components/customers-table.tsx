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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Users,
  X,
  Mail,
  Phone,
  MoreHorizontal,
} from "lucide-react";
import { CustomersFilters } from "./customers-filters";
import Pagination from "@/components/common/Pagination";
import {
  bulkDeleteCustomersAction,
  // Additional bulk actions can be added here
} from "@/app/actions/customers/customers";
import {
  Customer,
  SortField,
  SortDir,
} from "@/types/customers";
import { gooeyToast } from "@/components/ui/goey-toaster";

const formatDate = (d: string | Date) =>
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

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
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

interface CustomersTableProps {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDir: SortDir;
  isLoading?: boolean;
}

// ─── Column helper ────────────────────────────────────────────────────────────

const col = createColumnHelper<Customer>();

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomersTable({
  customers,
  total,
  page,
  pageSize,
  totalPages,
  search,
  dateFrom,
  dateTo,
  sortField,
  sortDir,
  isLoading = false,
}: CustomersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
          aria-label={`Select customer ${row.original.id}`}
          className="translate-y-px"
        />
      ),
    }),
    col.accessor(
      (row) => {
        const given = row.givenName || "";
        const family = row.familyName || "";
        return `${given} ${family}`.trim() || "—";
      },
      {
        id: "name",
        enableHiding: false,
        header: () => (
          <SortButton
            label="Name"
            field="givenName"
            currentField={sortField}
            currentDir={sortDir}
            onSort={pushSort}
            disabled={isPending}
          />
        ),
        cell: (info) => {
          const customer = info.row.original;
          return (
            <button
              className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
              onClick={() => router.push(`/admin/customers/${customer.id}`)}
            >
              {info.getValue()}
            </button>
          );
        },
      }
    ),
    col.accessor("emailAddress", {
      id: "emailAddress",
      header: () => (
        <SortButton
          label="Email"
          field="emailAddress"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => {
        const email = info.getValue();
        return email ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{email}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/60">—</span>
        );
      },
    }),
    col.accessor("phoneNumber", {
      id: "phoneNumber",
      header: () => (
        <SortButton
          label="Phone"
          field="phoneNumber"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => {
        const phone = info.getValue();
        return phone ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{phone}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/60">—</span>
        );
      },
    }),
    col.accessor("createdAt", {
      id: "createdAt",
      header: () => (
        <SortButton
          label="Created"
          field="createdAt"
          currentField={sortField}
          currentDir={sortDir}
          onSort={pushSort}
          disabled={isPending}
        />
      ),
      cell: (info) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    col.display({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => <CustomerRowActions customer={row.original} />,
    }),
  ];

  const table = useReactTable({
    data: customers,
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
  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.length} customer(s)? This action cannot be undone.`)) return;
    startTransition(async () => {
      const res = await bulkDeleteCustomersAction(selectedIds);
      if (res.error) {
        gooeyToast.error("", { description: res.error });
      } else {
        gooeyToast.success("Customers deleted.", {
          description: `${selectedIds.length} customer${selectedIds.length > 1 ? "s" : ""} removed.`,
        });
        setRowSelection({});
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="border-b border-border px-5 py-4">
        <CustomersFilters
          search={search}
          dateFrom={dateFrom}
          dateTo={dateTo}
          pageSize={pageSize}
          total={total}
          table={table}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} selected
          </span>
          <div className="ml-2 flex flex-wrap items-center gap-2">
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
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No customers found</p>
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
        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
        />
      </div>
    </>
  );
}

// ─── Row Actions Component ──────────────────────────────────────────────────

function CustomerRowActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleView = () => {
    router.push(`/admin/customers/${customer.id}`);
  };

  const handleEdit = () => {
    router.push(`/admin/customers/${customer.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${customer.givenName} ${customer.familyName || ''}"? This action cannot be undone.`)) return;
    startTransition(async () => {
      const { deleteCustomerAction } = await import("@/app/actions/customers/customers");
      const res = await deleteCustomerAction(customer.id);
      if (res.error) {
        gooeyToast.error("", { description: res.error });
      } else {
        gooeyToast.success("Customer deleted.", {
          description: `${customer.givenName} ${customer.familyName || ''} removed.`,
        });
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
        onClick={handleView}
        aria-label="View customer"
      >
        <Users className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleEdit}
        aria-label="Edit customer"
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
        aria-label="Delete customer"
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