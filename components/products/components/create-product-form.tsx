




/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  useActionState,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  Loader2,
  ArrowLeft,
  PackagePlus,
  X,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  createProductAction,
  CreateProductState,
  uploadImageToSupabase,
} from "@/app/actions/products/products";
import {
  ProductSizes as ProductSizesBase,
  ProductPrices as ProductPricesBase,
  ProductMaterials as ProductMaterialsBase,
  DraftSize,
  DraftPrice,
  DraftMaterial,
  DraftImage,
  ImageType,
  COLLECTIONS,
} from "./shared";

// Lazy load the image upload component to reduce initial bundle size
const UploadImage = dynamic(
  () => import("./shared").then((mod) => mod.UploadImage),
  {
    loading: () => (
      <div className="h-40 animate-pulse bg-muted/20 rounded-lg" />
    ),
    ssr: false,
  }
);

// Memoize the sub‑components to prevent re‑renders when parent state changes
const ProductSizes = memo(ProductSizesBase);
const ProductPrices = memo(ProductPricesBase);
const ProductMaterials = memo(ProductMaterialsBase);

// ----------------------------------------------------------------------
// Main CreateProductForm component
export function CreateProductForm() {
  const initialState: CreateProductState = { status: "idle" };
  const [state, formAction, isPending] = useActionState(
    createProductAction,
    initialState
  );

  // Basic info
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [collection, setCollection] = useState<"MEN" | "WOMEN">("MEN");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  // Nested collections
  const [sizes, setSizes] = useState<DraftSize[]>([]);
  const [prices, setPrices] = useState<DraftPrice[]>([]);
  const [materials, setMaterials] = useState<DraftMaterial[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [images, setImages] = useState<DraftImage[]>([]);

  // Existing categories fetched from server
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
  // Memoized derived values
  const availableCategories = useMemo(
    () =>
      existingCategories.filter(
        (cat) => !selectedCategoryIds.includes(cat.id)
      ),
    [existingCategories, selectedCategoryIds]
  );

  const isValid = useMemo(
    () =>
      name.trim() !== "" &&
      company.trim() !== "" &&
      description.trim() !== "" &&
      basePrice !== "" &&
      basePrice > 0,
    [name, company, description, basePrice]
  );

  const uploadImageDefaultImages: ImageType[] = useMemo(
    () =>
      images.map((img) => ({
        id: img.id,
        url: img.url,
        featured: img.isMain,
      })),
    [images]
  );

  const getCategoryName = useCallback(
    (id: string) =>
      existingCategories.find((c) => c.id === id)?.name ?? id,
    [existingCategories]
  );

  // --------------------------------------------------------------------
  // Stable handlers with useCallback
  const addCategory = useCallback(
    (catId: string) => {
      if (!selectedCategoryIds.includes(catId)) {
        setSelectedCategoryIds((prev) => [...prev, catId]);
      }
    },
    [selectedCategoryIds]
  );

  const removeCategory = useCallback((catId: string) => {
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== catId));
  }, []);

  const handleImagesChange = useCallback((newImages: ImageType[]) => {
    setImages(
      newImages.map((img) => ({
        id: img.id,
        url: img.url,
        isMain: img.featured ?? false,
      }))
    );
  }, []);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const url = await uploadImageToSupabase(file);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }, []);

  const handleImageDelete = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleSetFeatured = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isMain: img.id === id,
      }))
    );
  }, []);

  // --------------------------------------------------------------------
  // Submit handler – builds payload exactly matching Prisma schema field names
  const handleSubmit = useCallback(
    (formData: FormData) => {
      const formatDate = (dateStr?: string) =>
        dateStr ? new Date(dateStr).toISOString() : undefined;

      const payload = {
        name: name.trim(),
        company: company.trim(),
        description: description.trim(),
        base_price: Number(basePrice),
        collection,
        is_featured: isFeatured,
        is_custom: isCustom,

        sizes: sizes
          .filter((s) => s.size.trim() !== "")
          .map((s) => ({
            size: s.size.trim(),
            quantity: s.quantity,
            price_modifier: s.priceModifier,
          })),

        prices: prices
          .filter((p) => p.price > 0)
          .map((p) => ({
            price: p.price,
            type: p.type,
            name: p.name?.trim() || undefined,
            start_date: formatDate(p.startDate),
            end_date: formatDate(p.endDate),
            min_quantity: p.minQuantity,
            is_active: true,
          })),

        material: materials
          .filter((m) => m.name.trim() !== "")
          .map((m) => ({
            name: m.name.trim(),
          })),

        categories: selectedCategoryIds.map((id) => ({ id })),

        images: images
          .filter((img) => img.url.trim() !== "")
          .map((img) => ({
            image_url: img.url.trim(),
            is_main_image: img.isMain,
          })),
      };

      formData.set("payload", JSON.stringify(payload));
      formAction(formData);
    },
    [
      name,
      company,
      description,
      basePrice,
      collection,
      isFeatured,
      isCustom,
      sizes,
      prices,
      materials,
      selectedCategoryIds,
      images,
      formAction,
    ]
  );

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
              Create Product
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Add a new product with sizes, pricing, and media
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
              Discard
            </Button>
          </Link>
          <Button size="sm" type="submit" disabled={isPending || !isValid}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <PackagePlus className="mr-2 h-4 w-4" />
                Create Product
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