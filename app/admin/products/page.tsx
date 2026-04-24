
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getProductCountByActive, getProductCountByFeatured } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import type { SortField, SortDir, ActiveFilter, FeaturedFilter } from "@/types/products";
import { ProductsTable } from "@/components/products/components/products-table";
import StatCard from "@/components/common/StatCard";
import Link from "next/link";
import { TableSkeleton } from "@/components/common/Skeletons";
import { getCachedCategories } from '@/lib/categories';
export const metadata: Metadata = {
  title: "Products | Admin Dashboard",
  description: "Manage your product catalog",
};

// ISR: revalidate cached page every 60 seconds for each unique URL (including search params)
export const revalidate = 60;

// ─── Validation constants ─────────────────────────────────────────────────────

const VALID_PAGE_SIZES = new Set([10, 20, 50, 100]);
const DEFAULT_PAGE_SIZE = 10;

const VALID_SORT_FIELDS = new Set<string>([
  "name",
  "company",
  "base_price",
  "is_active",
  "is_featured",
  "created_at",
  "updated_at",
]);

// ─── Helper to parse search params ─────────────────────────────────────────
interface ParsedParams {
  search: string;
  isActive: ActiveFilter;
  isFeatured: FeaturedFilter;
  categoryId: string;
  priceMin: string;
  priceMax: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortField: SortField;
  sortDir: SortDir;
}

async function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): Promise<ParsedParams> {
  const search = typeof params.search === "string" ? params.search.trim() : "";

  const rawIsActive = typeof params.isActive === "string" ? params.isActive : "";
  const isActive: ActiveFilter =
    rawIsActive === "active" || rawIsActive === "inactive" ? rawIsActive : "all";

  const rawIsFeatured = typeof params.isFeatured === "string" ? params.isFeatured : "";
  const isFeatured: FeaturedFilter =
    rawIsFeatured === "featured" || rawIsFeatured === "not-featured" ? rawIsFeatured : "all";

  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "all";

  const priceMin = typeof params.priceMin === "string" ? params.priceMin : "";
  const priceMax = typeof params.priceMax === "string" ? params.priceMax : "";

  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";

  const page =
    typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const rawPageSize =
    typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const pageSize = VALID_PAGE_SIZES.has(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;

  const rawSort = typeof params.sort === "string" ? params.sort : "";
  const [rawField, rawDir] = rawSort.split(".");
  const sortField: SortField = VALID_SORT_FIELDS.has(rawField)
    ? (rawField as SortField)
    : "created_at";
  const sortDir: SortDir = rawDir === "asc" ? "asc" : "desc";

  return {
    search,
    isActive,
    isFeatured,
    categoryId,
    priceMin,
    priceMax,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sortField,
    sortDir,
  };
}

// ─── Async data‑fetching component (streamed inside the outer Suspense) ────────
async function ProductPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Resolve params
  const params = await searchParams;
  const parsed = await parseSearchParams(params);

  // Fetch everything in parallel (products, counts, categories)
  let result;
  let activeCount = 0;
  let inactiveCount = 0;
  let featuredCount = 0;
  let fetchError: string | null = null;
  let categories: { id: string; name: string }[] = [];

  try {
    [result, activeCount, inactiveCount, featuredCount, categories] = await Promise.all([
      getProducts({
        search: parsed.search,
        isActive: parsed.isActive,
        isFeatured: parsed.isFeatured,
        categoryId: parsed.categoryId,
        priceMin: parsed.priceMin,
        priceMax: parsed.priceMax,
        dateFrom: parsed.dateFrom,
        dateTo: parsed.dateTo,
        sortField: parsed.sortField,
        sortDir: parsed.sortDir,
        page: parsed.page,
        pageSize: parsed.pageSize,
      }),
      getProductCountByActive(true),
      getProductCountByActive(false),
      getProductCountByFeatured(true),
      
      getCachedCategories(),
    ]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load products.";
    result = { products: [], total: 0, page: 1, pageSize: parsed.pageSize, totalPages: 1 };
  }

  return (
    <>
      {/* Error state */}
      {fetchError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Products" value={result.total} />
        <StatCard label="Active" value={activeCount} accent="active" />
        <StatCard label="Inactive" value={inactiveCount} accent="inactive" />
        <StatCard label="Featured" value={featuredCount} accent="featured" />
      </div>

      {/* Main Card – filters, table, and pagination */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Inner Suspense removed: data is already fully loaded, table never suspends */}
        <ProductsTable
          products={result.products as any}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          search={parsed.search}
          isActive={parsed.isActive}
          isFeatured={parsed.isFeatured}
          categoryId={parsed.categoryId}
          priceMin={parsed.priceMin}
          priceMax={parsed.priceMax}
          dateFrom={parsed.dateFrom}
          dateTo={parsed.dateTo}
          sortField={parsed.sortField}
          sortDir={parsed.sortDir}
          categories={categories}
        />
      </div>
    </>
  );
}

// ─── Page shell (renders instantly, streams heavy content) ─────────────────────
interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
            </div>
            <p className="pl-12 text-sm text-muted-foreground">
              Manage your product catalog, inventory, and pricing.
            </p>
          </div>
          <Link href="/admin/products/create">
            <Button size="sm" className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </header>

        {/* Stream the data‑heavy content with a skeleton fallback */}
        <Suspense
          fallback={
            <div className="space-y-6">
              {/* Skeleton stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg border bg-card"
                  />
                ))}
              </div>
              {/* Skeleton table (pageSize hardcoded because params not yet resolved) */}
              <TableSkeleton pageSize={10} />
            </div>
          }
        >
          <ProductPageContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}