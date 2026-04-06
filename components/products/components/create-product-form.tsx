"use client";

import { useActionState, useCallback, useState } from "react";
import { Loader2, ArrowLeft, Plus, Trash2, PackagePlus } from "lucide-react";
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
import { createProductAction, CreateProductState } from "@/app/actions/products/products";

// Local types for nested form state
interface DraftSize {
  id: string; // temporary client id
  size: string;
  quantity: number;
  priceModifier: number;
}

interface DraftPrice {
  id: string;
  price: number;
  type: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  minQuantity?: number;
}

interface DraftMaterial {
  id: string;
  name: string;
}

interface DraftCategory {
  id: string;
  name: string;
}

interface DraftImage {
  id: string;
  url: string;
  isMain: boolean;
}

const initialState: CreateProductState = { status: "idle" };

// Available options from schema enums
const COLLECTIONS = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
];

const PRICE_TYPES = [
  { value: "STANDARD", label: "Standard" },
  { value: "SALE", label: "Sale" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "SEASONAL", label: "Seasonal" },
];

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
const COMMON_MATERIALS = ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Leather"];
const COMMON_CATEGORIES = ["Shirts", "Pants", "Dresses", "Jackets", "Accessories"];

export function CreateProductForm() {
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);

  // Basic info state
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
  const [categories, setCategories] = useState<DraftCategory[]>([]);
  const [images, setImages] = useState<DraftImage[]>([]);

  // Helper to generate temp ids
  const tempId = () => Math.random().toString(36).substring(2, 9);

  // Size handlers
  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      { id: tempId(), size: "M", quantity: 0, priceModifier: 0 },
    ]);
  };
  const updateSize = (id: string, field: keyof DraftSize, value: string | number) => {
    setSizes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: field === "size" ? String(value) : Number(value) } : s
      )
    );
  };
  const removeSize = (id: string) => {
    setSizes((prev) => prev.filter((s) => s.id !== id));
  };

  // Price handlers
  const addPrice = () => {
    setPrices((prev) => [
      ...prev,
      { id: tempId(), price: 0, type: "STANDARD", name: "" },
    ]);
  };
  const updatePrice = (id: string, field: keyof DraftPrice, value: any) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, [field]: field === "price" || field === "minQuantity" ? Number(value) : value }
          : p
      )
    );
  };
  const removePrice = (id: string) => {
    setPrices((prev) => prev.filter((p) => p.id !== id));
  };

  // Material handlers
  const addMaterial = () => {
    setMaterials((prev) => [...prev, { id: tempId(), name: "Cotton" }]);
  };
  const updateMaterial = (id: string, name: string) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
  };
  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // Category handlers
  const addCategory = () => {
    setCategories((prev) => [...prev, { id: tempId(), name: "Shirts" }]);
  };
  const updateCategory = (id: string, name: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };
  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Image handlers
  const addImage = () => {
    setImages((prev) => [...prev, { id: tempId(), url: "", isMain: prev.length === 0 }]);
  };
  const updateImage = (id: string, url: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, url } : img)));
  };
  const setMainImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isMain: img.id === id }))
    );
  };
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Validate required fields before submit
  const isValid = name.trim() && company.trim() && description.trim() && basePrice !== "" && basePrice > 0;

  const handleSubmit = (formData: FormData) => {
    // Build payload matching Prisma schema
    const payload = {
      name: name.trim(),
      company: company.trim(),
      description: description.trim(),
      basePrice: Number(basePrice),
      collection,
      isFeatured,
      isCustom,
      sizes: sizes.map((s) => ({
        size: s.size,
        quantity: s.quantity,
        priceModifier: s.priceModifier,
      })),
      prices: prices.map((p) => ({
        price: p.price,
        type: p.type,
        name: p.name || undefined,
        startDate: p.startDate || undefined,
        endDate: p.endDate || undefined,
        minQuantity: p.minQuantity || undefined,
      })),
      materials: materials.map((m) => ({ name: m.name })),
      categories: categories.map((c) => ({ name: c.name })),
      images: images.map((img, idx) => ({
        url: img.url,
        isMainImage: img.isMain,
      })),
    };
    formData.set("payload", JSON.stringify(payload));
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to products</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-none">Create Product</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Add a new product with sizes, pricing, and media
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/products">
            <Button variant="outline" size="sm" type="button" disabled={isPending}>
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
                  <CardTitle className="text-base">Basic Information</CardTitle>
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
                        Company / Brand <span className="text-destructive">*</span>
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
                        Base Price ($) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        placeholder="0.00"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Collection</Label>
                      <Select value={collection} onValueChange={(v) => setCollection(v as "MEN" | "WOMEN")} disabled={isPending}>
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
                      <p className="text-xs text-muted-foreground">Show on homepage / featured section</p>
                    </div>
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} disabled={isPending} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Custom Product</p>
                      <p className="text-xs text-muted-foreground">Enables custom order options</p>
                    </div>
                    <Switch checked={isCustom} onCheckedChange={setIsCustom} disabled={isPending} />
                  </div>
                </CardContent>
              </Card>

              {/* Product Variants / Sizes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Sizes & Inventory</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addSize} disabled={isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Size
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sizes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No sizes added. Click "Add Size" to create inventory variants.
                    </p>
                  )}
                  {sizes.map((size) => (
                    <div key={size.id} className="flex flex-wrap items-end gap-3 p-3 border rounded-md">
                      <div className="flex-1 min-w-[100px]">
                        <Label className="text-xs">Size</Label>
                        <Select value={size.size} onValueChange={(v) => updateSize(size.id, "size", v)} disabled={isPending}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_SIZES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={size.quantity}
                          onChange={(e) => updateSize(size.id, "quantity", parseInt(e.target.value) || 0)}
                          min={0}
                          disabled={isPending}
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Price Modifier ($)</Label>
                        <Input
                          type="number"
                          value={size.priceModifier}
                          onChange={(e) => updateSize(size.id, "priceModifier", parseInt(e.target.value) || 0)}
                          disabled={isPending}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSize(size.id)} disabled={isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Advanced Pricing (multiple price rules) */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Additional Pricing Rules</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addPrice} disabled={isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Price
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prices.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Optional: Add sale, wholesale, or seasonal prices.
                    </p>
                  )}
                  {prices.map((price) => (
                    <div key={price.id} className="p-3 border rounded-md space-y-2">
                      <div className="flex flex-wrap gap-3">
                        <div className="flex-1">
                          <Label className="text-xs">Price Type</Label>
                          <Select value={price.type} onValueChange={(v) => updatePrice(price.id, "type", v)} disabled={isPending}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_TYPES.map((pt) => (
                                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32">
                          <Label className="text-xs">Amount ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={price.price}
                            onChange={(e) => updatePrice(price.id, "price", parseFloat(e.target.value) || 0)}
                            disabled={isPending}
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-xs">Min Quantity</Label>
                          <Input
                            type="number"
                            value={price.minQuantity || ""}
                            onChange={(e) => updatePrice(price.id, "minQuantity", e.target.value ? parseInt(e.target.value) : undefined)}
                            disabled={isPending}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePrice(price.id)} disabled={isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label className="text-xs">Price Name (optional)</Label>
                          <Input
                            value={price.name || ""}
                            onChange={(e) => updatePrice(price.id, "name", e.target.value)}
                            placeholder="e.g., Summer Sale"
                            disabled={isPending}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Start Date</Label>
                          <Input type="date" value={price.startDate || ""} onChange={(e) => updatePrice(price.id, "startDate", e.target.value)} disabled={isPending} />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">End Date</Label>
                          <Input type="date" value={price.endDate || ""} onChange={(e) => updatePrice(price.id, "endDate", e.target.value)} disabled={isPending} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Materials</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addMaterial} disabled={isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((material) => (
                      <div key={material.id} className="flex items-center gap-1 border rounded-md px-2 py-1">
                        <Select value={material.name} onValueChange={(v) => updateMaterial(material.id, v)} disabled={isPending}>
                          <SelectTrigger className="border-0 h-7 w-32 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_MATERIALS.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMaterial(material.id)} disabled={isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {materials.length === 0 && (
                      <span className="text-sm text-muted-foreground">No materials added.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Categories</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addCategory} disabled={isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-1 border rounded-md px-2 py-1">
                        <Select value={cat.name} onValueChange={(v) => updateCategory(cat.id, v)} disabled={isPending}>
                          <SelectTrigger className="border-0 h-7 w-32 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCategory(cat.id)} disabled={isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <span className="text-sm text-muted-foreground">No categories added.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Product Images</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addImage} disabled={isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Image URL
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {images.map((img) => (
                    <div key={img.id} className="flex items-center gap-3">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={img.url}
                        onChange={(e) => updateImage(img.id, e.target.value)}
                        disabled={isPending}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={img.isMain ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMainImage(img.id)}
                          disabled={isPending}
                        >
                          Main
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(img.id)} disabled={isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Add at least one image URL. The first image will be the main one by default.
                    </p>
                  )}
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
                    <span className="font-medium truncate max-w-[180px]">{name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span>${basePrice || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sizes</span>
                    <span>{sizes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Rules</span>
                    <span>{prices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span>{images.length}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize">{isFeatured ? "Featured" : "Standard"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom enabled</span>
                    <span>{isCustom ? "Yes" : "No"}</span>
                  </div>
                </CardContent>
              </Card>

              {!isValid && (
                <Alert variant="default" className="text-amber-800 border-amber-200 bg-amber-50">
                  <AlertDescription className="text-xs">
                    Please fill in all required fields: Name, Company, Description, and Base Price.
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