/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect } from "react";
import { Loader2,
  Plus,
  Trash2,
  X,
  UploadCloud,
  Star,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ----------------------------------------------------------------------
// Types
export interface DraftSize {
  id: string;
  size: string;
  quantity: number;
  priceModifier: number;
}

export interface DraftPrice {
  id: string;
  price: number;
  type: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  minQuantity?: number;
}

export interface DraftMaterial {
  id: string;
  name: string;
}

export interface DraftImage {
  id: string;
  url: string;
  isMain: boolean;
  file?: File;
  existingId?: string;
}

// export interface ImageType {
//   id: string;
//   url: string;
//   featured?: boolean;
// }

// ----------------------------------------------------------------------
// Constants
export const COLLECTIONS = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
];

export const PRICE_TYPES = [
  { value: "STANDARD", label: "Standard" },
  { value: "SALE", label: "Sale" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "SEASONAL", label: "Seasonal" },
];

export const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
export const MATERIAL_SUGGESTIONS = [
  "Cotton",
  "Polyester",
  "Wool",
  "Silk",
  "Linen",
  "Leather",
];

// ----------------------------------------------------------------------
// Standalone ProductSizes Component
interface ProductSizesProps {
  defaultSizes?: DraftSize[];
  onChange?: (sizes: DraftSize[]) => void;
  title?: string;
  disabled?: boolean;
}

export const ProductSizes: React.FC<ProductSizesProps> = ({
  defaultSizes = [],
  onChange,
  title = "Sizes & Inventory",
  disabled = false,
}) => {
  const [sizes, setSizes] = useState<DraftSize[]>(defaultSizes);

  const tempId = () => Math.random().toString(36).substring(2, 9);

  const addSize = () => {
    const newSize = { id: tempId(), size: "", quantity: 0, priceModifier: 0 };
    setSizes((prev) => [...prev, newSize]);
  };

  const updateSize = (
    id: string,
    field: keyof DraftSize,
    value: string | number
  ) => {
    setSizes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, [field]: field === "size" ? String(value) : Number(value) }
          : s
      )
    );
  };

  const removeSize = (id: string) => {
    setSizes((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    onChange?.(sizes);
  }, [sizes]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSize}
          disabled={disabled}
        >
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
          <div
            key={size.id}
            className="flex flex-wrap items-end gap-3 p-3 border rounded-md"
          >
            <div className="flex-1 min-w-[120px]">
              <Label className="text-xs">Size Name</Label>
              <Input
                list="size-suggestions"
                value={size.size}
                onChange={(e) => updateSize(size.id, "size", e.target.value)}
                placeholder="e.g., S, M, L"
                disabled={disabled}
              />
            </div>
            <div className="w-28">
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                value={size.quantity}
                onChange={(e) =>
                  updateSize(size.id, "quantity", parseInt(e.target.value) || 0)
                }
                min={0}
                disabled={disabled}
              />
            </div>
            <div className="w-32">
              <Label className="text-xs">Price Modifier ($)</Label>
              <Input
                type="number"
                value={size.priceModifier}
                onChange={(e) =>
                  updateSize(
                    size.id,
                    "priceModifier",
                    parseInt(e.target.value) || 0
                  )
                }
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSize(size.id)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <datalist id="size-suggestions">
          {SIZE_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </CardContent>
    </Card>
  );
};

// ----------------------------------------------------------------------
// Standalone ProductPrices Component
interface ProductPricesProps {
  defaultPrices?: DraftPrice[];
  onChange?: (prices: DraftPrice[]) => void;
  title?: string;
  disabled?: boolean;
}

export const ProductPrices: React.FC<ProductPricesProps> = ({
  defaultPrices = [],
  onChange,
  title = "Additional Pricing Rules",
  disabled = false,
}) => {
  const [prices, setPrices] = useState<DraftPrice[]>(defaultPrices);

  const tempId = () => Math.random().toString(36).substring(2, 9);

  const addPrice = () => {
    const newPrice: DraftPrice = {
      id: tempId(),
      price: 0,
      type: "STANDARD",
      name: "",
    };
    setPrices((prev) => [...prev, newPrice]);
  };

  const updatePrice = (
    id: string,
    field: keyof DraftPrice,
    value: string | number | undefined
  ) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]:
                field === "price" || field === "minQuantity"
                  ? Number(value)
                  : value,
            }
          : p
      )
    );
  };

  const removePrice = (id: string) => {
    setPrices((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    onChange?.(prices);
  }, [prices]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPrice}
          disabled={disabled}
        >
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
                <Select
                  value={price.type}
                  onValueChange={(v) => updatePrice(price.id, "type", v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
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
                  onChange={(e) =>
                    updatePrice(
                      price.id,
                      "price",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <div className="w-32">
                <Label className="text-xs">Min Quantity</Label>
                <Input
                  type="number"
                  value={price.minQuantity || ""}
                  onChange={(e) =>
                    updatePrice(
                      price.id,
                      "minQuantity",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePrice(price.id)}
                disabled={disabled}
              >
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
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={price.startDate || ""}
                  onChange={(e) =>
                    updatePrice(price.id, "startDate", e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={price.endDate || ""}
                  onChange={(e) =>
                    updatePrice(price.id, "endDate", e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ----------------------------------------------------------------------
// Standalone ProductMaterials Component
interface ProductMaterialsProps {
  defaultMaterials?: DraftMaterial[];
  onChange?: (materials: DraftMaterial[]) => void;
  title?: string;
  disabled?: boolean;
}

export const ProductMaterials: React.FC<ProductMaterialsProps> = ({
  defaultMaterials = [],
  onChange,
  title = "Materials",
  disabled = false,
}) => {
  const [materials, setMaterials] = useState<DraftMaterial[]>(defaultMaterials);

  const tempId = () => Math.random().toString(36).substring(2, 9);

  const addMaterial = () => {
    const newMaterial = { id: tempId(), name: "" };
    setMaterials((prev) => [...prev, newMaterial]);
  };

  const updateMaterial = (id: string, name: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name } : m))
    );
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    onChange?.(materials);
  }, [materials]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMaterial}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center gap-1 border rounded-md px-2 py-1"
            >
              <Input
                list="material-suggestions"
                value={material.name}
                onChange={(e) => updateMaterial(material.id, e.target.value)}
                placeholder="e.g., Cotton"
                className="border-0 h-7 w-40 focus:ring-0 p-1"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeMaterial(material.id)}
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {materials.length === 0 && (
            <span className="text-sm text-muted-foreground">
              No materials added.
            </span>
          )}
        </div>
        <datalist id="material-suggestions">
          {MATERIAL_SUGGESTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </CardContent>
    </Card>
  );
};

// ----------------------------------------------------------------------
// Shadcn/ui styled UploadImage Component
export interface ImageType {
    id: string;
    url: string;
    featured?: boolean;
    existingId?: string;
  }
  
  interface UploadImageProps {
    defaultImages?: ImageType[];
    onUpload?: (file: File) => Promise<string>;
    onDelete?: (id: string) => void;
    onSetFeatured?: (id: string) => void;
    onChange?: (images: ImageType[]) => void;
    onDeleteExisting?: (imageId: string, existingId: string) => Promise<void>;
    title?: string;
    maxImages?: number;
    disabled?: boolean;
  }
  
  export const UploadImage: React.FC<UploadImageProps> = ({
    defaultImages = [],
    onUpload,
    onDelete,
    onSetFeatured,
    onChange,
    onDeleteExisting,
    title = "Images",
    maxImages,
    disabled = false,
  }) => {
    const [images, setImages] = useState<ImageType[]>(defaultImages);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
  
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || (maxImages && images.length >= maxImages)) return;
  
      setIsUploading(true);
      try {
        if (onUpload) {
          const imageUrl = await onUpload(file);
          const newImage = {
            id: Date.now().toString(),
            url: imageUrl,
          };
          setImages((prev) => [...prev, newImage]);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            const newImage = {
              url: event.target?.result as string,
              id: Date.now().toString(),
            };
            setImages((prev) => [...prev, newImage]);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };
  
    const handleRemoveImage = async (id: string) => {
      const imageToDelete = images.find((img) => img.id === id);
      if (!imageToDelete) return;
  
      if (imageToDelete.existingId && onDeleteExisting) {
        setDeletingId(id);
        try {
          await onDeleteExisting(id, imageToDelete.existingId);
          setImages((prev) => prev.filter((img) => img.id !== id));
          onDelete?.(id);
        } catch (error) {
          console.error("Failed to delete existing image:", error);
        } finally {
          setDeletingId(null);
        }
      } else {
        setImages((prev) => prev.filter((img) => img.id !== id));
        onDelete?.(id);
      }
    };
  
    const handleSetFeatured = (id: string) => {
      if (!onSetFeatured) return;
      onSetFeatured(id);
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          featured: img.id === id,
        }))
      );
    };
  
    useEffect(() => {
      onChange?.(images);
    }, [images, ]);
  
    return (
      <div className="space-y-4">
        {title && <h3 className="text-base font-medium">{title}</h3>}
  
        <div className="flex flex-wrap gap-3">
          {(!maxImages || images.length < maxImages) && (
            <div
              className={`
                relative flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed
                transition-shadow hover:shadow-md cursor-pointer
                ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="shadcn-image-upload"
                type="file"
                onChange={handleImageUpload}
                disabled={disabled || isUploading}
              />
              <label
                htmlFor="shadcn-image-upload"
                className="w-full h-full flex items-center justify-center cursor-pointer"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-full w-full"
                  disabled={disabled || isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Hourglass className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    )}
                  </span>
                </Button>
              </label>
            </div>
          )}
  
          {images.map((image) => (
            <div
              key={image.id}
              className={`
                relative w-32 h-32 rounded-lg border-2 overflow-hidden cursor-pointer
                transition-shadow hover:shadow-md
                ${image.featured ? "border-primary" : "border-border"}
              `}
              onClick={() => onSetFeatured && handleSetFeatured(image.id)}
            >
              {image.featured && onSetFeatured && (
                <div className="absolute top-2 right-2 z-10">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                </div>
              )}
              <img
                src={image.url}
                alt="Product"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/128x128?text=Error";
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute bottom-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(image.id);
                }}
                disabled={disabled || deletingId === image.id}
              >
                {deletingId === image.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
  
        {images.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No images added. Click the upload area to add images.
          </p>
        )}
      </div>
    );
  };