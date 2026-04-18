/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata } from "next";
import { Suspense } from "react";
import { getCustomers, getCustomerCounts } from "@/lib/customers";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import type { SortField, SortDir } from "@/types/customers";
import { CustomersTable } from "@/components/customers/components/customers-table";
import StatCard from "@/components/common/StatCard";
import Link from "next/link";
import { TableSkeleton } from "@/components/common/Skeletons";

export const metadata: Metadata = {
  title: "Customers | Admin Dashboard",
  description: "Manage your customer accounts and information",
};

export const dynamic = "force-dynamic";

// ─── Validation constants ─────────────────────────────────────────────────────

const VALID_PAGE_SIZES = new Set([10, 20, 50, 100]);
const DEFAULT_PAGE_SIZE = 10;

const VALID_SORT_FIELDS = new Set<string>([
  "givenName",
  "emailAddress",
  "phoneNumber",
  "createdAt",
  "updatedAt",
]);

// ─── Page ─────────────────────────────────────────────────────────────────────

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const CustomersPage = async ({ searchParams }: CustomersPageProps): Promise<React.ReactElement> => {
  const params = await searchParams;

  // ── Parse URL params ──
  const search = typeof params.search === "string" ? params.search.trim() : "";

  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";

  const page =
    typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const rawPageSize =
    typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const pageSize = VALID_PAGE_SIZES.has(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;

  // sort=<field>.<dir> e.g. "givenName.asc"
  const rawSort = typeof params.sort === "string" ? params.sort : "";
  const [rawField, rawDir] = rawSort.split(".");
  const sortField: SortField = VALID_SORT_FIELDS.has(rawField)
    ? (rawField as SortField)
    : "createdAt";
  const sortDir: SortDir = rawDir === "asc" ? "asc" : "desc";

  // ── Fetch data ──
  let result;
  let counts: { total: number; withEmail: number; withPhone: number } = {
    total: 0,
    withEmail: 0,
    withPhone: 0,
  };
  let fetchError: string | null = null;

  try {
    // Fetch customers and counts in parallel
    [result, counts] = await Promise.all([
      getCustomers({
        search,
        dateFrom,
        dateTo,
        sortField,
        sortDir,
        page,
        pageSize,
      }),
      getCustomerCounts(),
    ]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load customers.";
    result = { customers: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
            </div>
            <p className="pl-12 text-sm text-muted-foreground">
              View and manage customer profiles, contact information, and order history.
            </p>
          </div>
          <Link href="/admin/customers/create">
            <Button size="sm" className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        </header>

        {/* Error state */}
        {fetchError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {fetchError}
          </div>
        )}

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Total Customers" value={counts.total} />
          <StatCard label="With Email" value={counts.withEmail} accent="active" />
          <StatCard label="With Phone" value={counts.withPhone} accent="featured" />
        </div>

        {/* Main Card — filters, table, and pagination */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Suspense fallback={<TableSkeleton pageSize={pageSize} />}>
            <CustomersTable
              customers={result.customers as any}
              total={result.total}
              page={result.page}
              pageSize={result.pageSize}
              totalPages={result.totalPages}
              search={search}
              dateFrom={dateFrom}
              dateTo={dateTo}
              sortField={sortField}
              sortDir={sortDir}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default CustomersPage;