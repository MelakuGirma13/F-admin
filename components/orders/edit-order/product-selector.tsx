"use client";

import { useState, useCallback, useTransition } from "react";
import { Search, Loader2, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
  import { Badge } from "@/components/ui/badge";
import { Product, ProductVariant } from "@/types/orders";

interface ProductSelectorProps {
  onSelect: (product: Product, variant: ProductVariant) => void;
  disabled?: boolean;
}

export function ProductSelector({ onSelect, disabled }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();

  const search = useCallback((value: string) => {
    setQuery(value);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(value)}`
        );
        const data: Product[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      }
    });
  }, []);

  const handleSelect = useCallback(
    (product: Product, variant: ProductVariant) => {
      onSelect(product, variant);
      setOpen(false);
      setQuery("");
      setResults([]);
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <CommandInput
              placeholder="Search products…"
              value={query}
              onValueChange={search}
              className="border-0 focus:ring-0 h-10"
            />
          </div>
          <CommandList className="max-h-72">
            {!isPending && results.length === 0 && query.length > 0 && (
              <CommandEmpty>No products found.</CommandEmpty>
            )}
            {!isPending && query.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start typing to search…
              </div>
            )}
            {results.map((product) => (
              <CommandGroup
                key={product.id}
                heading={
                  <span className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" />
                    {product.name}
                  </span>
                }
              >
                {product.product_variants.map((variant) => (
                  <CommandItem
                    key={variant.id}
                    value={variant.id}
                    disabled={!variant.available_for_sale}
                    onSelect={() => handleSelect(product, variant)}
                    className="flex items-center justify-between py-2 cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {variant.label ?? "Default"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ${variant.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {variant.available_for_sale ? (
                        <Badge variant="secondary" className="text-xs">
                          {variant.stock_qty} in stock
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Out of stock
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
