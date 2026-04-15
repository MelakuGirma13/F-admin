

/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Tag,
  Ruler,
  Palette,
  Calendar,
  Star,
  Edit,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ----------------------------------------------------------------------
// Types (matching the API response from getProductById)
interface ProductSize {
  id: string;
  size: string;
  quantity: number;
  price_modifier: number;
}

interface ProductPrice {
  id: string;
  price: number;
  type: string;
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  min_quantity?: number | null;
  is_active: boolean;
}

interface ProductMaterial {
  id: string;
  name: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  is_main_image: boolean;
}

interface Product {
  id: string;
  name: string;
  company: string;
  description: string;
  base_price: number;
  collection: "MEN" | "WOMEN";
  is_featured: boolean;
  is_custom: boolean;
  sizes: ProductSize[];
  prices: ProductPrice[];
  material: ProductMaterial[];
  categories: ProductCategory[];
  images: ProductImage[];
}

// ----------------------------------------------------------------------
// Helper functions
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getPriceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    STANDARD: "Standard",
    SALE: "Sale",
    WHOLESALE: "Wholesale",
    SEASONAL: "Seasonal",
  };
  return labels[type] || type;
};

const getPriceTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "SALE":
      return "destructive";
    case "WHOLESALE":
      return "secondary";
    case "SEASONAL":
      return "outline";
    default:
      return "default";
  }
};

// ----------------------------------------------------------------------
// Main Component
interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  // Find main image or first image
  const mainImage =
    product.images.find((img) => img.is_main_image) || product.images[0];

  const [selectedImage, setSelectedImage] = useState<string>(
    mainImage?.image_url || "/placeholder-image.jpg"
  );

  // Calculate effective price (lowest active price among STANDARD and SALE, or base price)
  const getDisplayPrice = () => {
    const activePrices = product.prices.filter((p) => p.is_active);
    const salePrice = activePrices.find((p) => p.type === "SALE");
    const standardPrice = activePrices.find((p) => p.type === "STANDARD");

    if (salePrice) return salePrice.price;
    if (standardPrice) return standardPrice.price;
    return product.base_price;
  };

  const displayPrice = getDisplayPrice();
  const hasDiscount = displayPrice < product.base_price;

  return (
    <div className="flex flex-col h-full">
      {/* Header - improved vertical alignment */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to products</span>
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">
              Product Details
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              View product information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline" size="sm" type="button">
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Images */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Image Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/600x600?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Thumbnail Grid */}
                  {product.images.length > 1 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-4 gap-2">
                        {product.images.map((image) => (
                          <button
                            key={image.id}
                            type="button"
                            className={`
                              aspect-square rounded-md overflow-hidden border-2 transition-all
                              ${
                                selectedImage === image.image_url
                                  ? "border-primary ring-1 ring-primary"
                                  : "border-border hover:border-primary/50"
                              }
                            `}
                            onClick={() => setSelectedImage(image.image_url)}
                          >
                            <img
                              src={image.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Brand:</span>{" "}
                      <span className="font-medium">{product.company}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex items-center gap-2">
                      <span className="text-muted-foreground">Collection:</span>
                      <Badge variant="outline">{product.collection}</Badge>
                    </span>
                  </div>
                  {product.is_featured && (
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 shrink-0" />
                      <span className="text-sm font-medium">Featured Product</span>
                    </div>
                  )}
                  {product.is_custom && (
                    <div className="flex items-center gap-3">
                      <Palette className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">Custom Orders Available</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{product.name}</h2>
                      <p className="text-muted-foreground mt-1">
                        {product.company}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-bold">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-lg text-muted-foreground line-through">
                            {formatPrice(product.base_price)}
                          </span>
                          <Badge variant="destructive">
                            {Math.round(
                              ((product.base_price - displayPrice) /
                                product.base_price) *
                                100
                            )}
                            % OFF
                          </Badge>
                        </>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

{/* Tabs for additional info - Sticky top tabs on scroll */}
<div className="sticky top-0 z-10 bg-background pt-2 -mx-6 px-6">
  <Tabs defaultValue="sizes" className="w-full">
    <div className="rounded-lg border bg-card">
      <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-t-lg border-b">
        <TabsTrigger value="sizes" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-background">
          <Ruler className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Sizes & Stock</span>
          <span className="sm:hidden">Sizes</span>
        </TabsTrigger>
        <TabsTrigger value="pricing" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-background">
          <Tag className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Pricing Rules</span>
          <span className="sm:hidden">Pricing</span>
        </TabsTrigger>
        <TabsTrigger value="details" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-background">
          <Info className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Specifications</span>
          <span className="sm:hidden">Details</span>
        </TabsTrigger>
      </TabsList>

      <div className="p-4 sm:p-6">
        {/* Sizes Tab Content */}
        <TabsContent value="sizes" className="mt-0">
          {product.sizes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Ruler className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No size information available for this product.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[120px]">Size</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Price Adjustment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.sizes.map((size) => (
                      <TableRow key={size.id}>
                        <TableCell className="font-medium">{size.size}</TableCell>
                        <TableCell>
                          {size.quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>{size.quantity} in stock</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span>Out of stock</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {size.price_modifier === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : size.price_modifier > 0 ? (
                            <span className="text-green-600">
                              +{formatPrice(size.price_modifier)}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              -{formatPrice(Math.abs(size.price_modifier))}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {product.sizes.map((size) => (
                  <div
                    key={size.id}
                    className="border rounded-lg p-4 bg-background hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{size.size}</span>
                      <div className="text-right">
                        {size.price_modifier === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : size.price_modifier > 0 ? (
                          <span className="text-green-600 font-medium">
                            +{formatPrice(size.price_modifier)}
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            -{formatPrice(Math.abs(size.price_modifier))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {size.quantity > 0 ? (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{size.quantity} in stock</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <XCircle className="h-4 w-4" />
                          <span>Out of stock</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Pricing Tab Content */}
        <TabsContent value="pricing" className="mt-0">
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Base Price</h4>
                  <p className="text-2xl font-bold mt-1">{formatPrice(product.base_price)}</p>
                </div>
                <Badge variant="outline" className="h-fit self-start sm:self-auto">
                  Default
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Applied when no other pricing rule matches.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Active Pricing Rules
              </h4>
              {product.prices.filter((p) => p.is_active).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-lg">
                  <Tag className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No additional pricing rules configured.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {product.prices
                    .filter((p) => p.is_active)
                    .sort((a, b) => (a.type === "SALE" ? -1 : b.type === "SALE" ? 1 : 0))
                    .map((price) => (
                      <div
                        key={price.id}
                        className="p-4 border rounded-lg bg-background hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={getPriceTypeBadgeVariant(price.type)}>
                                {getPriceTypeLabel(price.type)}
                              </Badge>
                              {price.name && (
                                <span className="font-medium text-sm">{price.name}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {(price.start_date || price.end_date) && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>
                                    {formatDate(price.start_date) || "Always"} –{" "}
                                    {formatDate(price.end_date) || "Forever"}
                                  </span>
                                </div>
                              )}
                              {price.min_quantity && (
                                <div className="flex items-center gap-1.5">
                                  <Package className="h-3.5 w-3.5" />
                                  <span>Min. Qty: {price.min_quantity}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-xl font-bold">{formatPrice(price.price)}</p>
                            {price.type === "SALE" && price.price < product.base_price && (
                              <p className="text-xs text-green-600 font-medium">
                                Save {formatPrice(product.base_price - price.price)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Details Tab Content */}
        <TabsContent value="details" className="mt-0">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materials
              </h4>
              {product.material.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No materials specified.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {product.material.map((mat) => (
                    <Badge key={mat.id} variant="secondary" className="px-3 py-1">
                      {mat.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </h4>
              {product.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No categories assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((cat) => (
                    <Badge key={cat.id} variant="outline" className="px-3 py-1">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Additional Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product ID
                  </dt>
                  <dd className="text-sm font-mono bg-muted/30 px-3 py-1.5 rounded border break-all">
                    {product.id}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Collection
                  </dt>
                  <dd className="text-sm px-3 py-1.5">
                    <Badge variant="outline">{product.collection}</Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Featured Status
                  </dt>
                  <dd className="text-sm px-3 py-1.5 flex items-center gap-2">
                    {product.is_featured ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Featured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Not Featured</span>
                      </>
                    )}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Custom Orders
                  </dt>
                  <dd className="text-sm px-3 py-1.5 flex items-center gap-2">
                    {product.is_custom ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Disabled</span>
                      </>
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </div>
    </div>
  </Tabs>
</div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button variant="outline" asChild className="sm:w-auto w-full">
                  <Link href="/admin/products">Back to Products</Link>
                </Button>
                <Button asChild className="sm:w-auto w-full">
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}