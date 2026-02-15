"use client";

import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Plus, Pencil, Trash2, Boxes } from "lucide-react";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";

interface ProductItem {
  _id: string;
  name: string;
}

interface ColorItem {
  _id: string;
  name: string;
  hexCode: string;
}

interface SizeItem {
  _id: string;
  name: string;
}

interface VariantItem {
  _id: string;
  productId: string;
  colorId: string;
  sizeId: string;
  skuVariant: string;
  priceOverride?: number;
  stockQuantity: number;
  displayOrder: number;
  isPrimary: boolean;
  isActive: boolean;
  productName: string;
  colorName: string;
  colorHex: string;
  sizeName: string;
  mediaCount: number;
}

const optionalNonNegativeNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z.number().min(0, "Price override must be 0 or greater").optional()
);

const variantSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  colorId: z.string().min(1, "Color is required"),
  sizeId: z.string().min(1, "Size is required"),
  skuVariant: z
    .string()
    .trim()
    .min(1, "Variant SKU is required")
    .max(100, "Variant SKU is too long"),
  priceOverride: optionalNonNegativeNumber,
  stockQuantity: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock must be 0 or greater"),
  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order must be 0 or greater"),
});

export default function VariantsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantItem | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const variants = useQuery(api.variants.getAll, { includeInactive: true });
  const products = useQuery(api.products.getAll, { includeInactive: true });
  const colors = useQuery(api.colors.getAll, { includeInactive: false });
  const sizes = useQuery(api.sizes.getAll, { includeInactive: false });

  const createVariant = useMutation(api.variants.create);
  const updateVariant = useMutation(api.variants.update);
  const removeVariant = useMutation(api.variants.remove);

  const productOptions = (products || []) as ProductItem[];
  const colorOptions = (colors || []) as ColorItem[];
  const sizeOptions = (sizes || []) as SizeItem[];
  const selectedColor = colorOptions.find((color) => color._id === selectedColorId);

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingVariant(null);
    setSelectedProductId("");
    setSelectedColorId("");
    setSelectedSizeId("");
    setIsPrimary(false);
    setIsActive(true);
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingVariant(null);
    setSelectedProductId(productOptions[0]?._id || "");
    setSelectedColorId(colorOptions[0]?._id || "");
    setSelectedSizeId(sizeOptions[0]?._id || "");
    setIsPrimary(false);
    setIsActive(true);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (variant: VariantItem) => {
    setEditingVariant(variant);
    setSelectedProductId(variant.productId);
    setSelectedColorId(variant.colorId);
    setSelectedSizeId(variant.sizeId);
    setIsPrimary(variant.isPrimary);
    setIsActive(variant.isActive);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const parsed = variantSchema.safeParse({
      productId: selectedProductId,
      colorId: selectedColorId,
      sizeId: selectedSizeId,
      skuVariant: String(formData.get("skuVariant") ?? ""),
      priceOverride: String(formData.get("priceOverride") ?? "").trim(),
      stockQuantity: formData.get("stockQuantity") ?? "0",
      displayOrder: formData.get("displayOrder") ?? "0",
    });

    if (!parsed.success) {
      setFormErrors(zodToFormErrors(parsed.error));
      notify.validation();
      return;
    }

    const data = parsed.data;
    setFormErrors({});

    try {
      if (editingVariant) {
        await updateVariant({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: editingVariant._id as any,
          updates: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            productId: data.productId as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            colorId: data.colorId as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sizeId: data.sizeId as any,
            skuVariant: data.skuVariant,
            priceOverride: data.priceOverride,
            stockQuantity: data.stockQuantity,
            displayOrder: data.displayOrder,
            isPrimary,
            isActive,
          },
        });
        notify.updated("Variant");
      } else {
        await createVariant({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          productId: data.productId as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          colorId: data.colorId as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sizeId: data.sizeId as any,
          skuVariant: data.skuVariant,
          priceOverride: data.priceOverride,
          stockQuantity: data.stockQuantity,
          displayOrder: data.displayOrder,
          isPrimary,
        });
        notify.created("Variant");
      }

      resetDialogState();
    } catch (error) {
      notify.actionError("save variant", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this variant?")) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeVariant({ id: id as any });
      notify.deleted("Variant");
    } catch (error) {
      notify.actionError("delete variant", error);
    }
  };

  if (
    variants === undefined ||
    products === undefined ||
    colors === undefined ||
    sizes === undefined
  ) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Variants</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Variants</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {variants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Boxes className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No variants found</p>
            </div>
          ) : (
            <div className="divide-y">
              {(variants as VariantItem[]).map((variant) => (
                <div
                  key={variant._id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{variant.productName}</span>
                      {variant.isPrimary && <Badge>Primary</Badge>}
                      {!variant.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SKU: {variant.skuVariant} • {variant.colorName}/{variant.sizeName} • Stock:{" "}
                      {variant.stockQuantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Price override:{" "}
                      {variant.priceOverride
                        ? `Ks ${variant.priceOverride.toLocaleString()}`
                        : "Base price"}{" "}
                      • Media: {variant.mediaCount} • Order: {variant.displayOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(variant)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(variant._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetDialogState();
            return;
          }
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Edit Variant" : "Add Variant"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Field invalid={Boolean(formErrors.productId)}>
                <FieldLabel>Product *</FieldLabel>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger aria-invalid={Boolean(formErrors.productId)}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.productId && <FieldDescription>{formErrors.productId}</FieldDescription>}
              </Field>
              <Field invalid={Boolean(formErrors.colorId)}>
                <FieldLabel>Color *</FieldLabel>
                <Select value={selectedColorId} onValueChange={setSelectedColorId}>
                  <SelectTrigger aria-invalid={Boolean(formErrors.colorId)}>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color._id} value={color._id}>
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedColor && (
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: selectedColor.hexCode }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {selectedColor.name} ({selectedColor.hexCode})
                    </span>
                  </div>
                )}
                {formErrors.colorId && <FieldDescription>{formErrors.colorId}</FieldDescription>}
              </Field>
              <Field invalid={Boolean(formErrors.sizeId)}>
                <FieldLabel>Size *</FieldLabel>
                <Select value={selectedSizeId} onValueChange={setSelectedSizeId}>
                  <SelectTrigger aria-invalid={Boolean(formErrors.sizeId)}>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size._id} value={size._id}>
                        {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.sizeId && <FieldDescription>{formErrors.sizeId}</FieldDescription>}
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field invalid={Boolean(formErrors.skuVariant)}>
                <FieldLabel htmlFor="skuVariant">Variant SKU *</FieldLabel>
                <Input
                  id="skuVariant"
                  name="skuVariant"
                  defaultValue={editingVariant?.skuVariant}
                  aria-invalid={Boolean(formErrors.skuVariant)}
                  required
                />
                {formErrors.skuVariant && (
                  <FieldDescription>{formErrors.skuVariant}</FieldDescription>
                )}
              </Field>
              <Field invalid={Boolean(formErrors.priceOverride)}>
                <FieldLabel htmlFor="priceOverride">Price Override (Ks)</FieldLabel>
                <Input
                  id="priceOverride"
                  name="priceOverride"
                  type="number"
                  defaultValue={editingVariant?.priceOverride}
                  aria-invalid={Boolean(formErrors.priceOverride)}
                />
                {formErrors.priceOverride && (
                  <FieldDescription>{formErrors.priceOverride}</FieldDescription>
                )}
              </Field>
              <Field invalid={Boolean(formErrors.stockQuantity)}>
                <FieldLabel htmlFor="stockQuantity">Stock *</FieldLabel>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  defaultValue={editingVariant?.stockQuantity ?? 0}
                  aria-invalid={Boolean(formErrors.stockQuantity)}
                  required
                />
                {formErrors.stockQuantity && (
                  <FieldDescription>{formErrors.stockQuantity}</FieldDescription>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field invalid={Boolean(formErrors.displayOrder)}>
                <FieldLabel htmlFor="displayOrder">Display Order</FieldLabel>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  defaultValue={editingVariant?.displayOrder ?? 0}
                  aria-invalid={Boolean(formErrors.displayOrder)}
                />
                {formErrors.displayOrder && (
                  <FieldDescription>{formErrors.displayOrder}</FieldDescription>
                )}
              </Field>
              <div className="space-y-2 flex items-end gap-6 pb-2">
                <div className="flex items-center gap-2">
                  <Switch id="isPrimary" checked={isPrimary} onCheckedChange={setIsPrimary} />
                  <FieldLabel htmlFor="isPrimary">Primary</FieldLabel>
                </div>
                {editingVariant && (
                  <div className="flex items-center gap-2">
                    <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                    <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState}>
                Cancel
              </Button>
              <Button type="submit">{editingVariant ? "Update" : "Create"} Variant</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
