"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  total: number
}

export default function Pagination({
  page,
  totalPages,
  pageSize,
  total,
}: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => params.set(k, v))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function goToPage(p: number) {
    navigate({ page: String(p) })
  }

  const start = total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total)
  const end = Math.min(page * pageSize, total)

  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | "ellipsis")[] = [1]
    if (page > 3) pages.push("ellipsis")
    const rangeStart = Math.max(2, page - 1)
    const rangeEnd = Math.min(totalPages - 1, page + 1)
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
    if (page < totalPages - 2) pages.push("ellipsis")
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: result range */}
      <p className="text-sm text-muted-foreground">
        {total > 0 ? (
          <>
            Showing <span className="font-medium text-foreground">{start}</span>
            {"–"}
            <span className="font-medium text-foreground">{end}</span> of{" "}
            <span className="font-medium text-foreground">
              {total.toLocaleString()}
            </span>{" "}
            items
          </>
        ) : (
          "No items"
        )}
        {isPending && (
          <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </p>

      {/* Right: page navigator */}
      <nav
        className="flex items-center gap-1"
        aria-label="Pagination navigation"
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(1)}
          disabled={page <= 1 || isPending}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || isPending}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground select-none"
                aria-hidden="true"
              >
                &hellip;
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-sm"
                onClick={() => goToPage(p)}
                disabled={isPending}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || isPending}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(totalPages)}
          disabled={page >= totalPages || isPending}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  )
}
