


/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import {
  Loader2,
  ArrowLeft,
  PackageCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  updateProductAction,
  UpdateProductState,
  uploadImageToSupabase,
  deleteProductImage,
} from "@/app/actions/products/products";
import {
  ProductSizes,
  ProductPrices,
  ProductMaterials,
  UploadImage,
  DraftSize,
  DraftPrice,
  DraftMaterial,
  DraftImage,
  ImageType,
  COLLECTIONS,
} from "./shared";

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
// Main EditProductForm component
interface EditProductFormProps {
  product: Product;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const initialState: UpdateProductState = { status: "idle" };
  const [state, formAction, isPending] = useActionState(
    updateProductAction,
    initialState
  );

  // Basic info
  const [name, setName] = useState(product.name);
  const [company, setCompany] = useState(product.company);
  const [description, setDescription] = useState(product.description);
  const [basePrice, setBasePrice] = useState<number | "">(product.base_price);
  const [collection, setCollection] = useState<"MEN" | "WOMEN">(
    product.collection
  );
  const [isFeatured, setIsFeatured] = useState(product.is_featured);
  const [isCustom, setIsCustom] = useState(product.is_custom);

  // Nested collections – initialize from product
  const [sizes, setSizes] = useState<DraftSize[]>(
    product.sizes.map((s) => ({
      id: s.id,
      size: s.size,
      quantity: s.quantity,
      priceModifier: s.price_modifier,
    }))
  );
  const [prices, setPrices] = useState<DraftPrice[]>(
    product.prices.map((p) => ({
      id: p.id,
      price: Number(p.price),
      type: p.type,
      name: p.name || "",
      startDate: p.start_date
        ? new Date(p.start_date).toISOString().split("T")[0]
        : undefined,
      endDate: p.end_date
        ? new Date(p.end_date).toISOString().split("T")[0]
        : undefined,
      minQuantity: p.min_quantity || undefined,
    }))
  );
  const [materials, setMaterials] = useState<DraftMaterial[]>(
    product.material.map((m) => ({
      id: m.id,
      name: m.name,
    }))
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product.categories.map((c) => c.id)
  );
  const [images, setImages] = useState<DraftImage[]>(
    product.images.map((img) => ({
      id: img.id,
      url: img.image_url,
      isMain: img.is_main_image,
      existingId: img.id,
    }))
  );

  // Existing categories fetched from server (for adding new ones)
  const [existingCategories, setExistingCategories] = useState<
    { id: string; name: string }[]
  >([]);

  // Fetch existing categories on mount
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setExistingCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --------------------------------------------------------------------
  // Category handlers
  const addCategory = (catId: string) => {
    if (!selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds((prev) => [...prev, catId]);
    }
  };

  const removeCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== catId));
  };

  const availableCategories = existingCategories.filter(
    (cat) => !selectedCategoryIds.includes(cat.id)
  );

  // Helper to get category name by ID
  const getCategoryName = (id: string) =>
    existingCategories.find((c) => c.id === id)?.name ?? id;

  // --------------------------------------------------------------------
  // Image handlers
  const handleImagesChange = (newImages: ImageType[]) => {
    setImages(
      newImages.map((img) => ({
        id: img.id,
        url: img.url,
        isMain: img.featured ?? false,
        existingId: img.existingId,
      }))
    );
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const url = await uploadImageToSupabase(file);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleImageDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDeleteExistingImage = async (
    localId: string,
    existingId: string
  ) => {
    await deleteProductImage(existingId);
    setImages((prev) => prev.filter((img) => img.id !== localId));
  };

  const handleSetFeatured = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isMain: img.id === id,
      }))
    );
  };

  // --------------------------------------------------------------------
  // Validation
  const isValid =
    name.trim() &&
    company.trim() &&
    description.trim() &&
    basePrice !== "" &&
    basePrice > 0;

  // --------------------------------------------------------------------
  // Submit handler – builds payload matching the server action expectations
  const handleSubmit = (formData: FormData) => {
    const formatDate = (dateStr?: string) =>
      dateStr ? new Date(dateStr).toISOString() : undefined;

    const payload = {
      id: product.id,
      name: name.trim(),
      company: company.trim(),
      description: description.trim(),
      base_price: Number(basePrice),
      collection,
      is_featured: isFeatured,
      is_custom: isCustom,

      // Sizes: include DB id if present, otherwise undefined (new size)
      sizes: sizes
        .filter((s) => s.size.trim() !== "")
        .map((s) => ({
          id: s.id.startsWith("temp") ? undefined : s.id,
          size: s.size.trim(),
          quantity: s.quantity,
          price_modifier: s.priceModifier,
        })),

      // Prices
      prices: prices
        .filter((p) => p.price > 0)
        .map((p) => ({
          id: p.id.startsWith("temp") ? undefined : p.id,
          price: p.price,
          type: p.type,
          name: p.name?.trim() || undefined,
          start_date: formatDate(p.startDate),
          end_date: formatDate(p.endDate),
          min_quantity: p.minQuantity,
          is_active: true,
        })),

      // Materials (note: relation is "material" in Prisma)
      material: materials
        .filter((m) => m.name.trim() !== "")
        .map((m) => ({
          id: m.id.startsWith("temp") ? undefined : m.id,
          name: m.name.trim(),
        })),

      // Categories – just an array of IDs to connect
      categories: selectedCategoryIds.map((id) => ({ id })),

      // Images
      images: images
        .filter((img) => img.url.trim() !== "")
        .map((img) => ({
          id: img.existingId,
          image_url: img.url.trim(),
          is_main_image: img.isMain,
        })),
    };

    formData.set("payload", JSON.stringify(payload));
    formAction(formData);
  };

  const uploadImageDefaultImages: ImageType[] = images.map((img) => ({
    id: img.id,
    url: img.url,
    featured: img.isMain,
    existingId: img.existingId,
  }));

  return (
    <form action={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to products</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-none">
              Edit Product
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Update product details, inventory, and media
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isPending}
            >
              Cancel
            </Button>
          </Link>
          <Button size="sm" type="submit" disabled={isPending || !isValid}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <PackageCheck className="mr-2 h-4 w-4" />
                Update Product
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {state.status === "error" && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {state.status === "success" && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>Product updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">
                        Product Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Classic White Shirt"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company">
                        Company / Brand{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Your Brand Name"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed product description..."
                      rows={4}
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="basePrice">
                        Base Price ($){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={basePrice}
                        onChange={(e) =>
                          setBasePrice(
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        placeholder="0.00"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Collection</Label>
                      <Select
                        value={collection}
                        onValueChange={(v) =>
                          setCollection(v as "MEN" | "WOMEN")
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLLECTIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Featured Product</p>
                      <p className="text-xs text-muted-foreground">
                        Show on homepage / featured section
                      </p>
                    </div>
                    <Switch
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                      disabled={isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Custom Product</p>
                      <p className="text-xs text-muted-foreground">
                        Enables custom order options
                      </p>
                    </div>
                    <Switch
                      checked={isCustom}
                      onCheckedChange={setIsCustom}
                      disabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sizes & Inventory */}
              <ProductSizes
                defaultSizes={sizes}
                onChange={setSizes}
                disabled={isPending}
              />

              {/* Additional Pricing Rules */}
              <ProductPrices
                defaultPrices={prices}
                onChange={setPrices}
                disabled={isPending}
              />

              {/* Materials */}
              <ProductMaterials
                defaultMaterials={materials}
                onChange={setMaterials}
                disabled={isPending}
              />

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedCategoryIds.map((catId) => (
                        <Badge key={catId} variant="secondary" className="gap-1">
                          {getCategoryName(catId)}
                          <button
                            type="button"
                            onClick={() => removeCategory(catId)}
                            className="ml-1 hover:text-destructive"
                            disabled={isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {selectedCategoryIds.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No categories selected.
                        </span>
                      )}
                    </div>

                    <Select
                      value=""
                      onValueChange={addCategory}
                      disabled={isPending || availableCategories.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No more categories available
                          </div>
                        ) : (
                          availableCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Product Images */}
              <Card>
                <CardContent className="pt-6">
                  <UploadImage
                    defaultImages={uploadImageDefaultImages}
                    onUpload={handleImageUpload}
                    onDelete={handleImageDelete}
                    onSetFeatured={handleSetFeatured}
                    onChange={handleImagesChange}
                    onDeleteExisting={handleDeleteExistingImage}
                    title="Product Images"
                    maxImages={10}
                    disabled={isPending}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar - summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium truncate max-w-[180px]">
                      {name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span>${basePrice || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sizes</span>
                    <span>{sizes.filter((s) => s.size.trim()).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Rules</span>
                    <span>{prices.filter((p) => p.price > 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span>{images.filter((img) => img.url.trim()).length}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize">
                      {isFeatured ? "Featured" : "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Custom enabled
                    </span>
                    <span>{isCustom ? "Yes" : "No"}</span>
                  </div>
                </CardContent>
              </Card>

              {!isValid && (
                <Alert
                  variant="default"
                  className="text-amber-800 border-amber-200 bg-amber-50"
                >
                  <AlertDescription className="text-xs">
                    Please fill in all required fields: Name, Company,
                    Description, and Base Price.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}