export function PageLoadingSkeleton() {
    return (
      <div className="  w-full h-full p-4 bg-primary-100 animate-pulse"></div>
    );
  }


  export  function ProductDetailSkeleton() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </header>
  
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Images */}
              <div className="lg:col-span-1 space-y-6">
                {/* Main Image Card */}
                <div className="rounded-lg border bg-card">
                  <div className="p-6">
                    <div className="aspect-square rounded-lg bg-muted animate-pulse" />
                    {/* Thumbnails */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-md bg-muted animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                </div>
  
                {/* Quick Info Card */}
                <div className="rounded-lg border bg-card">
                  <div className="p-4">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded mb-3" />
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Right column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Header Card */}
                <div className="rounded-lg border bg-card p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="h-7 w-3/4 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-9 w-28 bg-muted animate-pulse rounded" />
                    <div className="h-px bg-border my-4" />
                    <div>
                      <div className="h-5 w-24 bg-muted animate-pulse rounded mb-2" />
                      <div className="space-y-1">
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Tabs Skeleton */}
                <div className="rounded-lg border bg-card">
                  <div className="grid grid-cols-3 p-1 bg-muted/50 border-b">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="py-2.5 flex justify-center items-center gap-2"
                      >
                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-12 bg-muted animate-pulse rounded hidden sm:block" />
                      </div>
                    ))}
                  </div>
                  <div className="p-6">
                    {/* Sizes skeleton (default active tab) */}
                    <div className="space-y-3">
                      <div className="hidden sm:block">
                        <div className="h-8 w-full bg-muted animate-pulse rounded mb-4" />
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-12 w-full bg-muted animate-pulse rounded mb-2" />
                        ))}
                      </div>
                      <div className="sm:hidden space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-lg" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <div className="h-10 w-full sm:w-36 bg-muted animate-pulse rounded-md" />
                  <div className="h-10 w-full sm:w-32 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  export  function EditProductSkeleton() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-40 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          </div>
        </header>
  
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Form sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded mb-4" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
                    </div>
                  </div>
                </div>
  
                {/* Sizes Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-28 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-16 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-16 w-full bg-muted animate-pulse rounded-md" />
                  </div>
                </div>
  
                {/* Pricing Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
                  </div>
                </div>
  
                {/* Materials Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
                    <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
                  </div>
                </div>
  
                {/* Categories Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="h-5 w-24 bg-muted animate-pulse rounded mb-4" />
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-7 w-16 bg-muted animate-pulse rounded-full" />
                      <div className="h-7 w-20 bg-muted animate-pulse rounded-full" />
                    </div>
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                  </div>
                </div>
  
                {/* Images Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="h-5 w-28 bg-muted animate-pulse rounded mb-4" />
                  <div className="flex gap-3">
                    <div className="h-32 w-32 bg-muted animate-pulse rounded-lg" />
                    <div className="h-32 w-32 bg-muted animate-pulse rounded-lg" />
                  </div>
                </div>
              </div>
  
              {/* Right sidebar - Summary */}
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-4">
                  <div className="h-5 w-20 bg-muted animate-pulse rounded mb-4" />
                  <div className="space-y-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export  function ProductsPageSkeleton() {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10">
                  <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-8 w-28 bg-muted animate-pulse rounded" />
              </div>
              <div className="pl-12 h-5 w-72 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-9 w-32 bg-muted animate-pulse rounded-md shrink-0" />
          </header>
  
          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
  
          {/* Main Card — filters, table, and pagination */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <TableSkeleton pageSize={10} />
          </div>
        </div>
      </main>
    );
  }
  
  // Optional: separate table skeleton for reuse in Suspense fallback
  export function TableSkeleton({ pageSize = 10 }: { pageSize?: number }) {
    return (
      <div className="p-4">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
        </div>
  
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </th>
                <th className="px-4 py-3 text-right">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(pageSize)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-md ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      </div>
    );
  }