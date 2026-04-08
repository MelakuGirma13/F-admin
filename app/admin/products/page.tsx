
import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getProductCountByActive, getProductCountByFeatured } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import type { SortField, SortDir, ActiveFilter, FeaturedFilter } from "@/types/products";
import { ProductsTable } from "@/components/products/components/products-table";
import Link from "next/link"
export const metadata: Metadata = {
  title: "Products | Admin Dashboard",
  description: "Manage your product catalog",
};

export const dynamic = "force-dynamic";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ProductsPage = async ({ searchParams }: ProductsPageProps): Promise<React.ReactElement> => {
  const params = await searchParams;

  // ── Parse URL params ──
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

  // sort=<field>.<dir> e.g. "name.asc"
  const rawSort = typeof params.sort === "string" ? params.sort : "";
  const [rawField, rawDir] = rawSort.split(".");
  const sortField: SortField = VALID_SORT_FIELDS.has(rawField)
    ? (rawField as SortField)
    : "created_at";
  const sortDir: SortDir = rawDir === "asc" ? "asc" : "desc";

  // ── Fetch data ──
  let result;
  let activeCount = 0;
  let inactiveCount = 0;
  let featuredCount = 0;
  let fetchError: string | null = null;

  try {
    // Fetch products and counts in parallel
    [result, activeCount, inactiveCount, featuredCount] = await Promise.all([
      getProducts({
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
        page,
        pageSize,
      }),
      getProductCountByActive(true),
      getProductCountByActive(false),
      getProductCountByFeatured(true),
    ]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load products.";
    result = { products: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  // Fetch all categories for filter dropdown
  let categories: { id: string; name: string }[] = [];
  try {
    const { getAllCategories } = await import("@/lib/categories");
    categories = await getAllCategories();
  } catch (err) {
    console.error("Failed to load categories", err);
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

        {/* Main Card — filters, table, and pagination */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Suspense fallback={<ProductsTableSkeleton pageSize={pageSize} />}>
            <ProductsTable
              products={result.products}
              total={result.total}
              page={result.page}
              pageSize={result.pageSize}
              totalPages={result.totalPages}
              search={search}
              isActive={isActive}
              isFeatured={isFeatured}
              categoryId={categoryId}
              priceMin={priceMin}
              priceMax={priceMax}
              dateFrom={dateFrom}
              dateTo={dateTo}
              sortField={sortField}
              sortDir={sortDir}
              categories={categories}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default ProductsPage;

// ─── Stat card ────────────────────────────────────────────────────────────────

const ACCENT_CLASSES: Record<string, string> = {
  active: "text-green-600 dark:text-green-400",
  inactive: "text-red-600 dark:text-red-400",
  featured: "text-amber-600 dark:text-amber-400",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
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
  );
}

// ─── Suspense fallback ────────────────────────────────────────────────────────

function ProductsTableSkeleton({ pageSize }: { pageSize: number }) {
  return (
    <div className="space-y-4 p-5">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 max-w-sm flex-1 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      {/* Rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}