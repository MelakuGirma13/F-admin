"use client";

import { useState, useTransition, useCallback } from "react";
import { Search, Loader2, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Product, ProductVariant } from "@/types/orders";

interface ProductSearchComboboxProps {
  onSelect: (product: Product, variant: ProductVariant) => void;
}

export function ProductSearchCombobox({ onSelect }: ProductSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch {
        // silently fail
      }
    });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-muted-foreground font-normal h-9"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0" />
            Search products&hellip;
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search products…"
            value={query}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isPending ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : products.length === 0 ? (
              <CommandEmpty>
                {query ? "No products found." : "Start typing to search products."}
              </CommandEmpty>
            ) : (
              products.map((product) => (
                <CommandGroup key={product.id} heading={product.name}>
                  {product.product_variants.map((variant) => (
                    <CommandItem
                      key={variant.id}
                      value={variant.id}
                      disabled={!variant.available_for_sale}
                      onSelect={() => {
                        onSelect(product, variant);
                        setOpen(false);
                        setQuery("");
                        setProducts([]);
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{variant.label ?? "Default"}</span>
                        {!variant.available_for_sale && (
                          <Badge variant="secondary" className="text-xs">Out of stock</Badge>
                        )}
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        ${variant.price.toFixed(2)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
