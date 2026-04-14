// /* eslint-disable react-hooks/set-state-in-effect */
// /* eslint-disable react/no-unescaped-entities */
// /* eslint-disable @typescript-eslint/no-explicit-any */

// "use client";

// import { useActionState, useState, useEffect, useCallback } from "react";
// import {
//   Loader2,
//   ArrowLeft,
//   Plus,
//   Trash2,
//   PackageCheck,
//   X,
//   UploadCloud,
//   ImageIcon,
//   Star,
//   Hourglass,
// } from "lucide-react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Separator } from "@/components/ui/separator";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   updateProductAction,
//   UpdateProductState,
//   uploadImageToSupabase,
//   deleteProductImage,
// } from "@/app/actions/products/products";

// // ----------------------------------------------------------------------
// // Types (extended from Prisma schema)
// interface ProductSize {
//   id: string;
//   size: string;
//   quantity: number;
//   priceModifier: number;
// }

// interface ProductPrice {
//   id: string;
//   price: number;
//   type: string;
//   name?: string | null;
//   startDate?: Date | null;
//   endDate?: Date | null;
//   minQuantity?: number | null;
// }

// interface ProductMaterial {
//   id: string;
//   name: string;
// }

// interface ProductCategory {
//   id: string;
//   name: string;
// }

// interface ProductImage {
//   id: string;
//   url: string;
//   isMainImage: boolean;
// }

// interface Product {
//   id: string;
//   name: string;
//   company: string;
//   description: string;
//   basePrice: number;
//   collection: "MEN" | "WOMEN";
//   isFeatured: boolean;
//   isCustom: boolean;
//   sizes: ProductSize[];
//   prices: ProductPrice[];
//   materials: ProductMaterial[];
//   categories: ProductCategory[];
//   images: ProductImage[];
// }

// // ----------------------------------------------------------------------
// // Draft types for internal form state
// interface DraftSize {
//   id: string;
//   size: string;
//   quantity: number;
//   priceModifier: number;
// }

// interface DraftPrice {
//   id: string;
//   price: number;
//   type: string;
//   name?: string;
//   startDate?: string;
//   endDate?: string;
//   minQuantity?: number;
// }

// interface DraftMaterial {
//   id: string;
//   name: string;
// }

// interface DraftCategory {
//   id: string;
//   name: string;
//   isExisting: boolean;
// }

// interface DraftImage {
//   id: string;
//   url: string;
//   isMain: boolean;
//   file?: File;
//   existingId?: string; // to track existing DB image
// }

// // ----------------------------------------------------------------------
// // Constants
// const COLLECTIONS = [
//   { value: "MEN", label: "Men" },
//   { value: "WOMEN", label: "Women" },
// ];

// const PRICE_TYPES = [
//   { value: "STANDARD", label: "Standard" },
//   { value: "SALE", label: "Sale" },
//   { value: "WHOLESALE", label: "Wholesale" },
//   { value: "SEASONAL", label: "Seasonal" },
// ];

// const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
// const MATERIAL_SUGGESTIONS = [
//   "Cotton",
//   "Polyester",
//   "Wool",
//   "Silk",
//   "Linen",
//   "Leather",
// ];

// // ----------------------------------------------------------------------
// // Standalone ProductSizes Component (unchanged from create form)
// interface ProductSizesProps {
//   defaultSizes?: DraftSize[];
//   onChange?: (sizes: DraftSize[]) => void;
//   title?: string;
//   disabled?: boolean;
// }

// const ProductSizes: React.FC<ProductSizesProps> = ({
//   defaultSizes = [],
//   onChange,
//   title = "Sizes & Inventory",
//   disabled = false,
// }) => {
//   const [sizes, setSizes] = useState<DraftSize[]>(defaultSizes);

//   const tempId = () => Math.random().toString(36).substring(2, 9);

//   const addSize = () => {
//     const newSize = { id: tempId(), size: "", quantity: 0, priceModifier: 0 };
//     setSizes((prev) => [...prev, newSize]);
//   };

//   const updateSize = (
//     id: string,
//     field: keyof DraftSize,
//     value: string | number
//   ) => {
//     setSizes((prev) =>
//       prev.map((s) =>
//         s.id === id
//           ? { ...s, [field]: field === "size" ? String(value) : Number(value) }
//           : s
//       )
//     );
//   };

//   const removeSize = (id: string) => {
//     setSizes((prev) => prev.filter((s) => s.id !== id));
//   };

//   useEffect(() => {
//     onChange?.(sizes);
//   }, [sizes, onChange]);

//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between">
//         <CardTitle className="text-base">{title}</CardTitle>
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={addSize}
//           disabled={disabled}
//         >
//           <Plus className="h-3.5 w-3.5 mr-1" /> Add Size
//         </Button>
//       </CardHeader>
//       <CardContent className="space-y-3">
//         {sizes.length === 0 && (
//           <p className="text-sm text-muted-foreground text-center py-2">
//             No sizes added. Click "Add Size" to create inventory variants.
//           </p>
//         )}
//         {sizes.map((size) => (
//           <div
//             key={size.id}
//             className="flex flex-wrap items-end gap-3 p-3 border rounded-md"
//           >
//             <div className="flex-1 min-w-[120px]">
//               <Label className="text-xs">Size Name</Label>
//               <Input
//                 list="size-suggestions"
//                 value={size.size}
//                 onChange={(e) => updateSize(size.id, "size", e.target.value)}
//                 placeholder="e.g., S, M, L"
//                 disabled={disabled}
//               />
//             </div>
//             <div className="w-28">
//               <Label className="text-xs">Quantity</Label>
//               <Input
//                 type="number"
//                 value={size.quantity}
//                 onChange={(e) =>
//                   updateSize(size.id, "quantity", parseInt(e.target.value) || 0)
//                 }
//                 min={0}
//                 disabled={disabled}
//               />
//             </div>
//             <div className="w-32">
//               <Label className="text-xs">Price Modifier ($)</Label>
//               <Input
//                 type="number"
//                 value={size.priceModifier}
//                 onChange={(e) =>
//                   updateSize(
//                     size.id,
//                     "priceModifier",
//                     parseInt(e.target.value) || 0
//                   )
//                 }
//                 disabled={disabled}
//               />
//             </div>
//             <Button
//               type="button"
//               variant="ghost"
//               size="icon"
//               onClick={() => removeSize(size.id)}
//               disabled={disabled}
//             >
//               <Trash2 className="h-4 w-4" />
//             </Button>
//           </div>
//         ))}
//         <datalist id="size-suggestions">
//           {SIZE_SUGGESTIONS.map((s) => (
//             <option key={s} value={s} />
//           ))}
//         </datalist>
//       </CardContent>
//     </Card>
//   );
// };

// // ----------------------------------------------------------------------
// // Standalone ProductPrices Component (unchanged)
// interface ProductPricesProps {
//   defaultPrices?: DraftPrice[];
//   onChange?: (prices: DraftPrice[]) => void;
//   title?: string;
//   disabled?: boolean;
// }

// const ProductPrices: React.FC<ProductPricesProps> = ({
//   defaultPrices = [],
//   onChange,
//   title = "Additional Pricing Rules",
//   disabled = false,
// }) => {
//   const [prices, setPrices] = useState<DraftPrice[]>(defaultPrices);

//   const tempId = () => Math.random().toString(36).substring(2, 9);

//   const addPrice = () => {
//     const newPrice: DraftPrice = {
//       id: tempId(),
//       price: 0,
//       type: "STANDARD",
//       name: "",
//     };
//     setPrices((prev) => [...prev, newPrice]);
//   };

//   const updatePrice = (
//     id: string,
//     field: keyof DraftPrice,
//     value: string | number | undefined
//   ) => {
//     setPrices((prev) =>
//       prev.map((p) =>
//         p.id === id
//           ? {
//               ...p,
//               [field]:
//                 field === "price" || field === "minQuantity"
//                   ? Number(value)
//                   : value,
//             }
//           : p
//       )
//     );
//   };

//   const removePrice = (id: string) => {
//     setPrices((prev) => prev.filter((p) => p.id !== id));
//   };

//   useEffect(() => {
//     onChange?.(prices);
//   }, [prices, onChange]);

//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between">
//         <CardTitle className="text-base">{title}</CardTitle>
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={addPrice}
//           disabled={disabled}
//         >
//           <Plus className="h-3.5 w-3.5 mr-1" /> Add Price
//         </Button>
//       </CardHeader>
//       <CardContent className="space-y-3">
//         {prices.length === 0 && (
//           <p className="text-sm text-muted-foreground text-center py-2">
//             Optional: Add sale, wholesale, or seasonal prices.
//           </p>
//         )}
//         {prices.map((price) => (
//           <div key={price.id} className="p-3 border rounded-md space-y-2">
//             <div className="flex flex-wrap gap-3">
//               <div className="flex-1">
//                 <Label className="text-xs">Price Type</Label>
//                 <Select
//                   value={price.type}
//                   onValueChange={(v) => updatePrice(price.id, "type", v)}
//                   disabled={disabled}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {PRICE_TYPES.map((pt) => (
//                       <SelectItem key={pt.value} value={pt.value}>
//                         {pt.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="w-32">
//                 <Label className="text-xs">Amount ($)</Label>
//                 <Input
//                   type="number"
//                   step="0.01"
//                   value={price.price}
//                   onChange={(e) =>
//                     updatePrice(
//                       price.id,
//                       "price",
//                       parseFloat(e.target.value) || 0
//                     )
//                   }
//                   disabled={disabled}
//                 />
//               </div>
//               <div className="w-32">
//                 <Label className="text-xs">Min Quantity</Label>
//                 <Input
//                   type="number"
//                   value={price.minQuantity || ""}
//                   onChange={(e) =>
//                     updatePrice(
//                       price.id,
//                       "minQuantity",
//                       e.target.value ? parseInt(e.target.value) : undefined
//                     )
//                   }
//                   disabled={disabled}
//                 />
//               </div>
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => removePrice(price.id)}
//                 disabled={disabled}
//               >
//                 <Trash2 className="h-4 w-4" />
//               </Button>
//             </div>
//             <div className="flex gap-3">
//               <div className="flex-1">
//                 <Label className="text-xs">Price Name (optional)</Label>
//                 <Input
//                   value={price.name || ""}
//                   onChange={(e) => updatePrice(price.id, "name", e.target.value)}
//                   placeholder="e.g., Summer Sale"
//                   disabled={disabled}
//                 />
//               </div>
//               <div className="flex-1">
//                 <Label className="text-xs">Start Date</Label>
//                 <Input
//                   type="date"
//                   value={price.startDate || ""}
//                   onChange={(e) =>
//                     updatePrice(price.id, "startDate", e.target.value)
//                   }
//                   disabled={disabled}
//                 />
//               </div>
//               <div className="flex-1">
//                 <Label className="text-xs">End Date</Label>
//                 <Input
//                   type="date"
//                   value={price.endDate || ""}
//                   onChange={(e) =>
//                     updatePrice(price.id, "endDate", e.target.value)
//                   }
//                   disabled={disabled}
//                 />
//               </div>
//             </div>
//           </div>
//         ))}
//       </CardContent>
//     </Card>
//   );
// };

// // ----------------------------------------------------------------------
// // Standalone ProductMaterials Component (unchanged)
// interface ProductMaterialsProps {
//   defaultMaterials?: DraftMaterial[];
//   onChange?: (materials: DraftMaterial[]) => void;
//   title?: string;
//   disabled?: boolean;
// }

// const ProductMaterials: React.FC<ProductMaterialsProps> = ({
//   defaultMaterials = [],
//   onChange,
//   title = "Materials",
//   disabled = false,
// }) => {
//   const [materials, setMaterials] = useState<DraftMaterial[]>(defaultMaterials);

//   const tempId = () => Math.random().toString(36).substring(2, 9);

//   const addMaterial = () => {
//     const newMaterial = { id: tempId(), name: "" };
//     setMaterials((prev) => [...prev, newMaterial]);
//   };

//   const updateMaterial = (id: string, name: string) => {
//     setMaterials((prev) =>
//       prev.map((m) => (m.id === id ? { ...m, name } : m))
//     );
//   };

//   const removeMaterial = (id: string) => {
//     setMaterials((prev) => prev.filter((m) => m.id !== id));
//   };

//   useEffect(() => {
//     onChange?.(materials);
//   }, [materials, onChange]);

//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between">
//         <CardTitle className="text-base">{title}</CardTitle>
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={addMaterial}
//           disabled={disabled}
//         >
//           <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
//         </Button>
//       </CardHeader>
//       <CardContent>
//         <div className="flex flex-wrap gap-2">
//           {materials.map((material) => (
//             <div
//               key={material.id}
//               className="flex items-center gap-1 border rounded-md px-2 py-1"
//             >
//               <Input
//                 list="material-suggestions"
//                 value={material.name}
//                 onChange={(e) => updateMaterial(material.id, e.target.value)}
//                 placeholder="e.g., Cotton"
//                 className="border-0 h-7 w-40 focus:ring-0 p-1"
//                 disabled={disabled}
//               />
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="icon"
//                 className="h-6 w-6"
//                 onClick={() => removeMaterial(material.id)}
//                 disabled={disabled}
//               >
//                 <Trash2 className="h-3 w-3" />
//               </Button>
//             </div>
//           ))}
//           {materials.length === 0 && (
//             <span className="text-sm text-muted-foreground">
//               No materials added.
//             </span>
//           )}
//         </div>
//         <datalist id="material-suggestions">
//           {MATERIAL_SUGGESTIONS.map((m) => (
//             <option key={m} value={m} />
//           ))}
//         </datalist>
//       </CardContent>
//     </Card>
//   );
// };

// // ----------------------------------------------------------------------
// // Adapted UploadImage component with support for existing images
// interface ImageType {
//   id: string;
//   url: string;
//   featured?: boolean;
//   existingId?: string; // optional existing DB id
// }

// interface UploadImageProps {
//   defaultImages?: ImageType[];
//   onUpload?: (file: File) => Promise<string>;
//   onDelete?: (id: string) => void;
//   onSetFeatured?: (id: string) => void;
//   onChange?: (images: ImageType[]) => void;
//   title?: string;
//   maxImages?: number;
//   disabled?: boolean;
//   // Additional for edit: handle deletion of existing image
//   onDeleteExisting?: (imageId: string, existingId: string) => Promise<void>;
// }

// export const UploadImage: React.FC<UploadImageProps> = ({
//   defaultImages = [],
//   onUpload,
//   onDelete,
//   onSetFeatured,
//   onChange,
//   title = "Images",
//   maxImages,
//   disabled = false,
//   onDeleteExisting,
// }) => {
//   const [images, setImages] = useState<ImageType[]>(defaultImages);
//   const [isUploading, setIsUploading] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || (maxImages && images.length >= maxImages)) return;

//     setIsUploading(true);
//     try {
//       if (onUpload) {
//         const imageUrl = await onUpload(file);
//         const newImage = {
//           id: Date.now().toString(),
//           url: imageUrl,
//         };
//         setImages((prev) => [...prev, newImage]);
//       } else {
//         const reader = new FileReader();
//         reader.onload = (event) => {
//           const newImage = {
//             url: event.target?.result as string,
//             id: Date.now().toString(),
//           };
//           setImages((prev) => [...prev, newImage]);
//         };
//         reader.readAsDataURL(file);
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     } finally {
//       setIsUploading(false);
//       e.target.value = "";
//     }
//   };

//   const handleRemoveImage = async (id: string) => {
//     const imageToDelete = images.find((img) => img.id === id);
//     if (!imageToDelete) return;

//     // If it's an existing image (has existingId), call the delete handler
//     if (imageToDelete.existingId && onDeleteExisting) {
//       setDeletingId(id);
//       try {
//         await onDeleteExisting(id, imageToDelete.existingId);
//         setImages((prev) => prev.filter((img) => img.id !== id));
//         onDelete?.(id);
//       } catch (error) {
//         console.error("Failed to delete existing image:", error);
//       } finally {
//         setDeletingId(null);
//       }
//     } else {
//       // Newly added image (no existingId) – just remove from state
//       setImages((prev) => prev.filter((img) => img.id !== id));
//       onDelete?.(id);
//     }
//   };

//   const handleSetFeatured = (id: string) => {
//     if (!onSetFeatured) return;
//     onSetFeatured(id);
//     setImages((prev) =>
//       prev.map((img) => ({
//         ...img,
//         featured: img.id === id,
//       }))
//     );
//   };

//   useEffect(() => {
//     onChange?.(images);
//   }, [images, onChange]);

//   return (
//     <div className="space-y-4">
//       {title && <h3 className="text-base font-medium">{title}</h3>}

//       <div className="flex flex-wrap gap-3">
//         {(!maxImages || images.length < maxImages) && (
//           <div
//             className={`
//               relative flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed
//               transition-shadow hover:shadow-md cursor-pointer
//               ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
//             `}
//           >
//             <input
//               accept="image/*"
//               style={{ display: "none" }}
//               id="shadcn-image-upload"
//               type="file"
//               onChange={handleImageUpload}
//               disabled={disabled || isUploading}
//             />
//             <label
//               htmlFor="shadcn-image-upload"
//               className="w-full h-full flex items-center justify-center cursor-pointer"
//             >
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="icon"
//                 className="h-full w-full"
//                 disabled={disabled || isUploading}
//                 asChild
//               >
//                 <span>
//                   {isUploading ? (
//                     <Hourglass className="h-8 w-8 animate-spin text-muted-foreground" />
//                   ) : (
//                     <UploadCloud className="h-8 w-8 text-muted-foreground" />
//                   )}
//                 </span>
//               </Button>
//             </label>
//           </div>
//         )}

//         {images.map((image) => (
//           <div
//             key={image.id}
//             className={`
//               relative w-32 h-32 rounded-lg border-2 overflow-hidden cursor-pointer
//               transition-shadow hover:shadow-md
//               ${image.featured ? "border-primary" : "border-border"}
//             `}
//             onClick={() => onSetFeatured && handleSetFeatured(image.id)}
//           >
//             {image.featured && onSetFeatured && (
//               <div className="absolute top-2 right-2 z-10">
//                 <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
//               </div>
//             )}
//             <img
//               src={image.url}
//               alt="Uploaded content"
//               className="w-full h-full object-cover"
//               onError={(e) => {
//                 (e.target as HTMLImageElement).src =
//                   "https://placehold.co/128x128?text=Error";
//               }}
//             />
//             <Button
//               type="button"
//               variant="ghost"
//               size="icon"
//               className="absolute bottom-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleRemoveImage(image.id);
//               }}
//               disabled={disabled || deletingId === image.id}
//             >
//               {deletingId === image.id ? (
//                 <Loader2 className="h-4 w-4 animate-spin" />
//               ) : (
//                 <Trash2 className="h-4 w-4" />
//               )}
//             </Button>
//           </div>
//         ))}
//       </div>

//       {images.length === 0 && (
//         <p className="text-sm text-muted-foreground text-center py-4">
//           No images added. Click the upload area to add images.
//         </p>
//       )}
//     </div>
//   );
// };

// // ----------------------------------------------------------------------
// // Main EditProductForm component
// interface EditProductFormProps {
//   product: Product;
// }

// export function EditProductForm({ product }: EditProductFormProps) {
//   const initialState: UpdateProductState = { status: "idle" };
//   const [state, formAction, isPending] = useActionState(
//     updateProductAction,
//     initialState
//   );

//   // Basic info
//   const [name, setName] = useState(product.name);
//   const [company, setCompany] = useState(product.company);
//   const [description, setDescription] = useState(product.description);
//   const [basePrice, setBasePrice] = useState<number | "">(product.basePrice);
//   const [collection, setCollection] = useState<"MEN" | "WOMEN">(
//     product.collection
//   );
//   const [isFeatured, setIsFeatured] = useState(product.isFeatured);
//   const [isCustom, setIsCustom] = useState(product.isCustom);

//   // Nested collections – initialize from product
//   const [sizes, setSizes] = useState<DraftSize[]>(
//     product.sizes.map((s) => ({
//       id: s.id,
//       size: s.size,
//       quantity: s.quantity,
//       priceModifier: s.priceModifier,
//     }))
//   );
//   const [prices, setPrices] = useState<DraftPrice[]>(
//     product.prices.map((p) => ({
//       id: p.id,
//       price: p.price,
//       type: p.type,
//       name: p.name || "",
//       startDate: p.startDate
//         ? new Date(p.startDate).toISOString().split("T")[0]
//         : undefined,
//       endDate: p.endDate
//         ? new Date(p.endDate).toISOString().split("T")[0]
//         : undefined,
//       minQuantity: p.minQuantity || undefined,
//     }))
//   );
//   const [materials, setMaterials] = useState<DraftMaterial[]>(
//     product.material.map((m) => ({
//       id: m.id,
//       name: m.name,
//     }))
//   );
//   const [categories, setCategories] = useState<DraftCategory[]>(
//     product.categories.map((c) => ({
//       id: c.id,
//       name: c.name,
//       isExisting: true,
//     }))
//   );
//   const [images, setImages] = useState<DraftImage[]>(
//     product.images.map((img) => ({
//       id: img.id,
//       url: img.url,
//       isMain: img.isMainImage,
//       existingId: img.id,
//     }))
//   );

//   // Existing categories fetched from server (for adding new ones)
//   const [existingCategories, setExistingCategories] = useState<
//     { id: string; name: string }[]
//   >([]);
//   const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

//   // Fetch existing categories on mount
//   const fetchCategories = useCallback(async () => {
//     try {
//       const res = await fetch("/api/categories");
//       if (res.ok) {
//         const data = await res.json();
//         setExistingCategories(data);
//       }
//     } catch (error) {
//       console.error("Failed to fetch categories", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   // --------------------------------------------------------------------
//   // Category handlers
//   const addCategory = (catId: string) => {
//     const existingCat = existingCategories.find((c) => c.id === catId);
//     if (!existingCat) return;

//     if (categories.some((c) => c.id === catId)) return;

//     setCategories((prev) => [
//       ...prev,
//       { id: existingCat.id, name: existingCat.name, isExisting: true },
//     ]);
//     setSelectedCategoryId("");
//   };

//   const removeCategory = (id: string) => {
//     setCategories((prev) => prev.filter((c) => c.id !== id));
//   };

//   const availableCategories = existingCategories.filter(
//     (cat) => !categories.some((c) => c.id === cat.id)
//   );

//   // --------------------------------------------------------------------
//   // Image handlers
//   const handleImagesChange = (newImages: ImageType[]) => {
//     setImages(
//       newImages.map((img) => ({
//         id: img.id,
//         url: img.url,
//         isMain: img.featured ?? false,
//         existingId: img.existingId,
//       }))
//     );
//   };

//   const handleImageUpload = async (file: File): Promise<string> => {
//     try {
//       const url = await uploadImageToSupabase(file);
//       return url;
//     } catch (error) {
//       console.error("Upload error:", error);
//       throw error;
//     }
//   };

//   const handleImageDelete = (id: string) => {
//     setImages((prev) => prev.filter((img) => img.id !== id));
//   };

//   const handleDeleteExistingImage = async (
//     localId: string,
//     existingId: string
//   ) => {
//     // Call server action to delete from storage and DB
//     await deleteProductImage(existingId);
//     // Remove from state after successful deletion
//     setImages((prev) => prev.filter((img) => img.id !== localId));
//   };

//   const handleSetFeatured = (id: string) => {
//     setImages((prev) =>
//       prev.map((img) => ({
//         ...img,
//         isMain: img.id === id,
//       }))
//     );
//   };

//   // --------------------------------------------------------------------
//   // Validation
//   const isValid =
//     name.trim() &&
//     company.trim() &&
//     description.trim() &&
//     basePrice !== "" &&
//     basePrice > 0;

//   // --------------------------------------------------------------------
//   // Submit handler
//   const handleSubmit = (formData: FormData) => {
//     // Prepare payload for update
//     const payload = {
//       id: product.id,
//       name: name.trim(),
//       company: company.trim(),
//       description: description.trim(),
//       basePrice: Number(basePrice),
//       collection,
//       isFeatured,
//       isCustom,
//       sizes: sizes
//         .filter((s) => s.size.trim() !== "")
//         .map((s) => ({
//           id: s.id.startsWith("temp") ? undefined : s.id, // keep existing id if present
//           size: s.size.trim(),
//           quantity: s.quantity,
//           priceModifier: s.priceModifier,
//         })),
//       prices: prices
//         .filter((p) => p.price > 0)
//         .map((p) => ({
//           id: p.id.startsWith("temp") ? undefined : p.id,
//           price: p.price,
//           type: p.type,
//           name: p.name?.trim() || undefined,
//           startDate: p.startDate || undefined,
//           endDate: p.endDate || undefined,
//           minQuantity: p.minQuantity || undefined,
//         })),
//       materials: materials
//         .filter((m) => m.name.trim() !== "")
//         .map((m) => ({
//           id: m.id.startsWith("temp") ? undefined : m.id,
//           name: m.name.trim(),
//         })),
//       categories: categories.map((c) => ({
//         id: c.isExisting ? c.id : undefined,
//         name: c.name,
//       })),
//       images: images
//         .filter((img) => img.url.trim() !== "")
//         .map((img) => ({
//           id: img.existingId, // keep existing id if any
//           url: img.url.trim(),
//           isMainImage: img.isMain,
//         })),
//     };

//     formData.set("payload", JSON.stringify(payload));
//     formAction(formData);
//   };

//   const uploadImageDefaultImages: ImageType[] = images.map((img) => ({
//     id: img.id,
//     url: img.url,
//     featured: img.isMain,
//     existingId: img.existingId,
//   }));

//   return (
//     <form action={handleSubmit} className="flex flex-col h-full">
//       {/* Header */}
//       <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
//         <div className="flex items-center gap-3">
//           <Link href="/products">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-8 w-8"
//               type="button"
//             >
//               <ArrowLeft className="h-4 w-4" />
//               <span className="sr-only">Back to products</span>
//             </Button>
//           </Link>
//           <div>
//             <h1 className="text-base font-semibold leading-none">
//               Edit Product
//             </h1>
//             <p className="text-xs text-muted-foreground mt-1">
//               Update product details, inventory, and media
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <Link href="/products">
//             <Button
//               variant="outline"
//               size="sm"
//               type="button"
//               disabled={isPending}
//             >
//               Cancel
//             </Button>
//           </Link>
//           <Button size="sm" type="submit" disabled={isPending || !isValid}>
//             {isPending ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Updating…
//               </>
//             ) : (
//               <>
//                 <PackageCheck className="mr-2 h-4 w-4" />
//                 Update Product
//               </>
//             )}
//           </Button>
//         </div>
//       </header>

//       {/* Body */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="mx-auto max-w-5xl px-6 py-6">
//           {state.status === "error" && (
//             <Alert variant="destructive" className="mb-6">
//               <AlertDescription>{state.message}</AlertDescription>
//             </Alert>
//           )}
//           {state.status === "success" && (
//             <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
//               <AlertDescription>Product updated successfully!</AlertDescription>
//             </Alert>
//           )}

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Main content */}
//             <div className="lg:col-span-2 space-y-6">
//               {/* Basic Information */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-base">
//                     Basic Information
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                       <Label htmlFor="name">
//                         Product Name <span className="text-destructive">*</span>
//                       </Label>
//                       <Input
//                         id="name"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         placeholder="Classic White Shirt"
//                         disabled={isPending}
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label htmlFor="company">
//                         Company / Brand{" "}
//                         <span className="text-destructive">*</span>
//                       </Label>
//                       <Input
//                         id="company"
//                         value={company}
//                         onChange={(e) => setCompany(e.target.value)}
//                         placeholder="Your Brand Name"
//                         disabled={isPending}
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label htmlFor="description">
//                       Description <span className="text-destructive">*</span>
//                     </Label>
//                     <Textarea
//                       id="description"
//                       value={description}
//                       onChange={(e) => setDescription(e.target.value)}
//                       placeholder="Detailed product description..."
//                       rows={4}
//                       disabled={isPending}
//                     />
//                   </div>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                       <Label htmlFor="basePrice">
//                         Base Price ($){" "}
//                         <span className="text-destructive">*</span>
//                       </Label>
//                       <Input
//                         id="basePrice"
//                         type="number"
//                         step="0.01"
//                         value={basePrice}
//                         onChange={(e) =>
//                           setBasePrice(
//                             e.target.value === ""
//                               ? ""
//                               : parseFloat(e.target.value)
//                           )
//                         }
//                         placeholder="0.00"
//                         disabled={isPending}
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label>Collection</Label>
//                       <Select
//                         value={collection}
//                         onValueChange={(v) =>
//                           setCollection(v as "MEN" | "WOMEN")
//                         }
//                         disabled={isPending}
//                       >
//                         <SelectTrigger>
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {COLLECTIONS.map((c) => (
//                             <SelectItem key={c.value} value={c.value}>
//                               {c.label}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium">Featured Product</p>
//                       <p className="text-xs text-muted-foreground">
//                         Show on homepage / featured section
//                       </p>
//                     </div>
//                     <Switch
//                       checked={isFeatured}
//                       onCheckedChange={setIsFeatured}
//                       disabled={isPending}
//                     />
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium">Custom Product</p>
//                       <p className="text-xs text-muted-foreground">
//                         Enables custom order options
//                       </p>
//                     </div>
//                     <Switch
//                       checked={isCustom}
//                       onCheckedChange={setIsCustom}
//                       disabled={isPending}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Sizes & Inventory */}
//               <ProductSizes
//                 defaultSizes={sizes}
//                 onChange={setSizes}
//                 disabled={isPending}
//               />

//               {/* Additional Pricing Rules */}
//               <ProductPrices
//                 defaultPrices={prices}
//                 onChange={setPrices}
//                 disabled={isPending}
//               />

//               {/* Materials */}
//               <ProductMaterials
//                 defaultMaterials={materials}
//                 onChange={setMaterials}
//                 disabled={isPending}
//               />

//               {/* Categories */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-base">Categories</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     <div className="flex flex-wrap gap-2">
//                       {categories.map((cat) => (
//                         <Badge key={cat.id} variant="secondary" className="gap-1">
//                           {cat.name}
//                           <button
//                             type="button"
//                             onClick={() => removeCategory(cat.id)}
//                             className="ml-1 hover:text-destructive"
//                             disabled={isPending}
//                           >
//                             <X className="h-3 w-3" />
//                           </button>
//                         </Badge>
//                       ))}
//                       {categories.length === 0 && (
//                         <span className="text-sm text-muted-foreground">
//                           No categories selected.
//                         </span>
//                       )}
//                     </div>

//                     <Select
//                       value={selectedCategoryId}
//                       onValueChange={addCategory}
//                       disabled={isPending || availableCategories.length === 0}
//                     >
//                       <SelectTrigger className="w-full">
//                         <SelectValue placeholder="Select a category" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {availableCategories.length === 0 ? (
//                           <div className="px-2 py-1.5 text-sm text-muted-foreground">
//                             No more categories available
//                           </div>
//                         ) : (
//                           availableCategories.map((cat) => (
//                             <SelectItem key={cat.id} value={cat.id}>
//                               {cat.name}
//                             </SelectItem>
//                           ))
//                         )}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Product Images */}
//               <Card>
//                 <CardContent className="pt-6">
//                   <UploadImage
//                     defaultImages={uploadImageDefaultImages}
//                     onUpload={handleImageUpload}
//                     onDelete={handleImageDelete}
//                     onSetFeatured={handleSetFeatured}
//                     onChange={handleImagesChange}
//                     onDeleteExisting={handleDeleteExistingImage}
//                     title="Product Images"
//                     maxImages={10}
//                     disabled={isPending}
//                   />
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Right sidebar - summary */}
//             <div className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-base">Summary</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Name</span>
//                     <span className="font-medium truncate max-w-[180px]">
//                       {name || "—"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Base Price</span>
//                     <span>${basePrice || "0.00"}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Sizes</span>
//                     <span>{sizes.filter((s) => s.size.trim()).length}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Price Rules</span>
//                     <span>{prices.filter((p) => p.price > 0).length}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Images</span>
//                     <span>{images.filter((img) => img.url.trim()).length}</span>
//                   </div>
//                   <Separator className="my-2" />
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Status</span>
//                     <span className="capitalize">
//                       {isFeatured ? "Featured" : "Standard"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">
//                       Custom enabled
//                     </span>
//                     <span>{isCustom ? "Yes" : "No"}</span>
//                   </div>
//                 </CardContent>
//               </Card>

//               {!isValid && (
//                 <Alert
//                   variant="default"
//                   className="text-amber-800 border-amber-200 bg-amber-50"
//                 >
//                   <AlertDescription className="text-xs">
//                     Please fill in all required fields: Name, Company,
//                     Description, and Base Price.
//                   </AlertDescription>
//                 </Alert>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </form>
//   );
// }



/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  PackageCheck,
  X,
  UploadCloud,
  Star,
  Hourglass,
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
  materials: ProductMaterial[];
  categories: ProductCategory[];
  images: ProductImage[];
}

// ----------------------------------------------------------------------
// Draft types for internal form state
interface DraftSize {
  id: string;
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
  isExisting: boolean;
}

interface DraftImage {
  id: string;
  url: string;
  isMain: boolean;
  existingId?: string; // original DB id for existing images
}

// ----------------------------------------------------------------------
// Constants
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

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
const MATERIAL_SUGGESTIONS = [
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

const ProductSizes: React.FC<ProductSizesProps> = ({
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
  }, [sizes, onChange]);

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

const ProductPrices: React.FC<ProductPricesProps> = ({
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
  }, [prices, onChange]);

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

const ProductMaterials: React.FC<ProductMaterialsProps> = ({
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
  }, [materials, onChange]);

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
// Adapted UploadImage component with support for existing images
interface ImageType {
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
  }, [images, onChange]);

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
    product.materials.map((m) => ({
      id: m.id,
      name: m.name,
    }))
  );
  const [categories, setCategories] = useState<DraftCategory[]>(
    product.categories.map((c) => ({
      id: c.id,
      name: c.name,
      isExisting: true,
    }))
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

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
    const existingCat = existingCategories.find((c) => c.id === catId);
    if (!existingCat) return;

    if (categories.some((c) => c.id === catId)) return;

    setCategories((prev) => [
      ...prev,
      { id: existingCat.id, name: existingCat.name, isExisting: true },
    ]);
    setSelectedCategoryId("");
  };

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const availableCategories = existingCategories.filter(
    (cat) => !categories.some((c) => c.id === cat.id)
  );

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
  // Submit handler
  const handleSubmit = (formData: FormData) => {
    // Prepare payload for update
    const payload = {
      id: product.id,
      name: name.trim(),
      company: company.trim(),
      description: description.trim(),
      basePrice: Number(basePrice),
      collection,
      isFeatured,
      isCustom,
      sizes: sizes
        .filter((s) => s.size.trim() !== "")
        .map((s) => ({
          id: s.id.startsWith("temp") ? undefined : s.id,
          size: s.size.trim(),
          quantity: s.quantity,
          priceModifier: s.priceModifier,
        })),
      prices: prices
        .filter((p) => p.price > 0)
        .map((p) => ({
          id: p.id.startsWith("temp") ? undefined : p.id,
          price: p.price,
          type: p.type,
          name: p.name?.trim() || undefined,
          startDate: p.startDate || undefined,
          endDate: p.endDate || undefined,
          minQuantity: p.minQuantity || undefined,
        })),
      materials: materials
        .filter((m) => m.name.trim() !== "")
        .map((m) => ({
          id: m.id.startsWith("temp") ? undefined : m.id,
          name: m.name.trim(),
        })),
      categories: categories.map((c) => ({
        id: c.isExisting ? c.id : undefined,
        name: c.name,
      })),
      images: images
        .filter((img) => img.url.trim() !== "")
        .map((img) => ({
          id: img.existingId,
          url: img.url.trim(),
          isMainImage: img.isMain,
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
          <Link href="/products">
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
          <Link href="/products">
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
                      {categories.map((cat) => (
                        <Badge key={cat.id} variant="secondary" className="gap-1">
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => removeCategory(cat.id)}
                            className="ml-1 hover:text-destructive"
                            disabled={isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {categories.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No categories selected.
                        </span>
                      )}
                    </div>

                    <Select
                      value={selectedCategoryId}
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