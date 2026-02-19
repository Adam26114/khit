"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Eye, EyeOff, Pencil, Plus, Package, Trash2 } from "lucide-react";
import { resolveImageSrc } from "@/lib/image";
import { AdminMediaUploader } from "@/components/admin/media-uploader";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";

interface ColorVariant {
  name: string;
  hex: string;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  sizes: string[];
  colors: ColorVariant[];
  images: string[];
  imageRefs?: string[];
  isFeatured: boolean;
  isPublished?: boolean;
  isActive: boolean;
  isOutOfStock: boolean;
  categoryId: string;
}

interface SizeOption {
  _id: string;
  name: string;
  sizeCategory: string;
  displayOrder: number;
}

const optionalNonNegativeNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z.number().min(0, "Sale price must be 0 or greater").optional()
);

const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required")
      .max(150, "Product name is too long"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(1000, "Description is too long"),
    price: z.coerce.number().min(1, "Price must be greater than 0"),
    salePrice: optionalNonNegativeNumber,
    categoryId: z.string().min(1, "Category is required"),
    sizes: z.array(z.string()).min(1, "Select at least one size"),
    stock: z.coerce
      .number()
      .int("Stock must be a whole number")
      .min(0, "Stock must be 0 or greater"),
    images: z.array(z.string()).min(1, "Upload at least one product image"),
    colors: z
      .array(
        z.object({
          name: z.string(),
          hex: z.string(),
          stock: z.number(),
        })
      )
      .optional(),
    isFeatured: z.boolean(),
    isPublished: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.salePrice !== undefined && data.salePrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salePrice"],
        message: "Sale price must be less than or equal to price",
      });
    }
  });

export default function ProductsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<Record<string, string>>({});
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const products = useQuery(api.products.getAll, {});
  const categories = useQuery(api.categories.getActive);
  const sizes = useQuery(api.sizes.getAll, {});
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const availableSizes = useMemo(() => {
    const uniqueByName = new Map<string, SizeOption>();
    for (const size of (sizes as SizeOption[] | undefined) ?? []) {
      const normalizedName = size.name.trim().toUpperCase();
      if (!normalizedName || uniqueByName.has(normalizedName)) continue;
      uniqueByName.set(normalizedName, {
        ...size,
        name: normalizedName,
      });
    }
    return Array.from(uniqueByName.values());
  }, [sizes]);

  const groupedSizes = useMemo(() => {
    const grouped = new Map<string, SizeOption[]>();
    for (const size of availableSizes) {
      const category = (size.sizeCategory || "apparel").trim().toLowerCase();
      const items = grouped.get(category) ?? [];
      items.push(size);
      grouped.set(category, items);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [availableSizes]);

  useEffect(() => {
    const allowed = new Set(availableSizes.map((size) => size.name));
    setSelectedSizes((previous) => previous.filter((size) => allowed.has(size)));
  }, [availableSizes]);

  const clearBlobPreviews = (previewMap: Record<string, string>) => {
    Object.values(previewMap).forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
  };

  const resetDialogState = () => {
    clearBlobPreviews(uploadedImagePreviews);
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setUploadedImages([]);
    setUploadedImagePreviews({});
    setSelectedSizes([]);
    setColorVariants([]);
    setFormErrors({});
  };

  const openCreate = () => {
    clearBlobPreviews(uploadedImagePreviews);
    setEditingProduct(null);
    setUploadedImages([]);
    setUploadedImagePreviews({});
    setSelectedSizes([]);
    setColorVariants([]);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    const availableSizeNameSet = new Set(availableSizes.map((size) => size.name));
    const normalizedProductSizes = (product.sizes || [])
      .map((size) => size.trim().toUpperCase())
      .filter(Boolean);

    setEditingProduct(product);
    setSelectedSizes(
      normalizedProductSizes.filter((size) => availableSizeNameSet.has(size))
    );
    setColorVariants(product.colors || []);

    const imageRefs = product.imageRefs?.length ? product.imageRefs : product.images || [];
    setUploadedImages(imageRefs);
    setUploadedImagePreviews(
      Object.fromEntries(
        imageRefs.map((ref, index) => [
          ref,
          product.images?.[index] ? resolveImageSrc(product.images[index]) : resolveImageSrc(ref),
        ])
      )
    );

    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const parsed = productSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: formData.get("price") ?? "0",
      salePrice: String(formData.get("salePrice") ?? "").trim(),
      categoryId: String(formData.get("categoryId") ?? ""),
      sizes: selectedSizes,
      colors: colorVariants,
      stock: formData.get("stock") ?? "0",
      images: uploadedImages,
      isFeatured: formData.get("isFeatured") === "on",
      isPublished: formData.get("isPublished") === "on",
    });

    if (!parsed.success) {
      setFormErrors(zodToFormErrors(parsed.error));
      notify.validation();
      return;
    }

    const data = parsed.data;
    setFormErrors({});

    try {
      if (editingProduct) {
        await updateProduct({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: editingProduct._id as any,
          updates: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            price: data.price,
            salePrice: data.salePrice,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            categoryId: data.categoryId as any,
            sizes: data.sizes,
            colors: data.colors ?? [],
            stock: data.stock,
            images: data.images,
            isFeatured: data.isFeatured,
            isPublished: data.isPublished,
          },
        });
        notify.updated("Product");
      } else {
        await createProduct({
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          salePrice: data.salePrice,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categoryId: data.categoryId as any,
          sizes: data.sizes,
          colors: data.colors ?? [],
          stock: data.stock,
          images: data.images,
          isFeatured: data.isFeatured,
          isPublished: data.isPublished,
        });
        notify.created("Product");
      }
      resetDialogState();
    } catch (error) {
      notify.actionError("save product", error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeProduct({ id: productId as any });
      notify.deleted("Product");
    } catch (error) {
      notify.actionError("delete product", error);
    }
  };

  const handleTogglePublished = async (product: Product) => {
    const nextPublished = product.isPublished === false;
    try {
      await updateProduct({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: product._id as any,
        updates: {
          isPublished: nextPublished,
        },
      });
      notify.success(`Product ${nextPublished ? "published" : "unpublished"}`);
    } catch (error) {
      notify.actionError("update product visibility", error);
    }
  };

  const handleBulkDelete = async (rows: Product[]) => {
    if (rows.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${rows.length} selected products?`)) return;

    let deletedCount = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await removeProduct({ id: row._id as any });
        deletedCount += 1;
      } catch (error) {
        notify.actionError(`delete product "${row.name}"`, error);
      }
    }

    if (deletedCount > 0) {
      notify.success(`${deletedCount} products deleted successfully`);
    }
  };

  if (products === undefined || categories === undefined || sizes === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Products</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>

      <AdminDataTable
        data={(products as Product[]) || []}
        getRowId={(product) => product._id}
        emptyTitle="Empty"
        emptyDescription="No products found."
        emptyIcon={Package}
        searchPlaceholder="Filter products..."
        toolbarActions={[
          {
            label: "Create Product",
            icon: Plus,
            onClick: openCreate,
          },
        ]}
        rowActions={(product) => [
          {
            label: "Update",
            icon: Pencil,
            onClick: () => openEdit(product),
          },
          {
            label: product.isPublished === false ? "Make Public" : "Make Unpublic",
            icon: product.isPublished === false ? Eye : EyeOff,
            onClick: () => handleTogglePublished(product),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => handleDelete(product._id),
          },
        ]}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Delete selected products"
        columns={[
          {
            id: "name",
            header: "Product",
            searchAccessor: (product) => `${product.name} ${product.description ?? ""} ${product.slug}`,
            cell: (product) => (
              <span className="font-medium">{product.name}</span>
            ),
          },
          {
            id: "slug",
            header: "Slug",
            defaultHidden: true,
            searchAccessor: (product) => product.slug,
            cell: (product) => (
              <span className="text-sm text-muted-foreground">{product.slug}</span>
            ),
          },
          {
            id: "stock",
            header: "Stock",
            cell: (product) => <span className="font-medium tabular-nums">{product.stock}</span>,
          },
          {
            id: "status",
            header: "Status",
            searchAccessor: (product) => (product.isPublished === false ? "unpublic" : "public"),
            sortAccessor: (product) => (product.isPublished === false ? 0 : 1),
            cell: (product) => (
              <span className={product.isPublished === false ? "text-muted-foreground" : "text-foreground"}>
                {product.isPublished === false ? "Unpublic" : "Public"}
              </span>
            ),
          },
          {
            id: "price",
            header: "Price",
            searchAccessor: (product) =>
              `${product.price} ${product.salePrice ?? ""} ${product.isFeatured ? "featured" : ""}`,
            cell: (product) => {
              const displayPrice = product.salePrice ?? product.price;
              return <span className="font-medium tabular-nums">Ks {displayPrice.toLocaleString()}</span>;
            },
          },
        ] satisfies AdminTableColumn<Product>[]}
      />

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetDialogState();
            return;
          }
          setIsAddDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.name)}>
                <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  aria-invalid={Boolean(formErrors.name)}
                  required
                />
                <FieldDescription className={!formErrors.name ? "invisible" : undefined}>
                  {formErrors.name ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.slug)}>
                <FieldLabel htmlFor="slug">Slug *</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingProduct?.slug}
                  aria-invalid={Boolean(formErrors.slug)}
                  required
                />
                <FieldDescription className={!formErrors.slug ? "invisible" : undefined}>
                  {formErrors.slug ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <Field invalid={Boolean(formErrors.description)}>
              <FieldLabel htmlFor="description">Description *</FieldLabel>
              <Input
                id="description"
                name="description"
                defaultValue={editingProduct?.description}
                aria-invalid={Boolean(formErrors.description)}
                required
              />
              <FieldDescription className={!formErrors.description ? "invisible" : undefined}>
                {formErrors.description ?? " "}
              </FieldDescription>
            </Field>

            <div className="grid grid-cols-3 items-start gap-4">
              <Field invalid={Boolean(formErrors.price)}>
                <FieldLabel htmlFor="price">Price (Ks) *</FieldLabel>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={editingProduct?.price}
                  aria-invalid={Boolean(formErrors.price)}
                  required
                />
                <FieldDescription className={!formErrors.price ? "invisible" : undefined}>
                  {formErrors.price ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.salePrice)}>
                <FieldLabel htmlFor="salePrice">Sale Price (Ks)</FieldLabel>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  defaultValue={editingProduct?.salePrice}
                  aria-invalid={Boolean(formErrors.salePrice)}
                />
                <FieldDescription className={!formErrors.salePrice ? "invisible" : undefined}>
                  {formErrors.salePrice ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.stock)}>
                <FieldLabel htmlFor="stock">Stock *</FieldLabel>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={editingProduct?.stock}
                  aria-invalid={Boolean(formErrors.stock)}
                  required
                />
                <FieldDescription className={!formErrors.stock ? "invisible" : undefined}>
                  {formErrors.stock ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <Field invalid={Boolean(formErrors.categoryId)}>
              <FieldLabel htmlFor="categoryId">Category *</FieldLabel>
              <Select name="categoryId" defaultValue={editingProduct?.categoryId}>
                <SelectTrigger aria-invalid={Boolean(formErrors.categoryId)}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories as { _id: string; name: string }[] | undefined)?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription className={!formErrors.categoryId ? "invisible" : undefined}>
                {formErrors.categoryId ?? " "}
              </FieldDescription>
            </Field>

            <Field invalid={Boolean(formErrors.sizes)}>
              <FieldLabel>Sizes</FieldLabel>
              {availableSizes.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  No sizes found. Create sizes in Catalog Tools → Sizes first.
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedSizes.map(([category, categorySizes]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categorySizes.map((size) => (
                          <Button
                            key={size._id}
                            type="button"
                            variant={selectedSizes.includes(size.name) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedSizes((prev) =>
                                prev.includes(size.name)
                                  ? prev.filter((value) => value !== size.name)
                                  : [...prev, size.name]
                              );
                            }}
                          >
                            {size.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <FieldDescription className={!formErrors.sizes ? "invisible" : undefined}>
                {formErrors.sizes ?? " "}
              </FieldDescription>
            </Field>

            <Field invalid={Boolean(formErrors.images)}>
              <AdminMediaUploader
                label="Images"
                files={uploadedImages}
                previews={uploadedImagePreviews}
                onFilesChange={setUploadedImages}
                onPreviewsChange={setUploadedImagePreviews}
                requestUploadUrl={() => generateUploadUrl({})}
                accept="image/*"
                multiple
                maxFiles={8}
                previewKind="image"
                compressImages
                successMessage="Image uploaded as WebP (max 1920x1080)"
              />
              <FieldDescription className={!formErrors.images ? "invisible" : undefined}>
                {formErrors.images ?? " "}
              </FieldDescription>
            </Field>

            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                name="isFeatured"
                defaultChecked={editingProduct?.isFeatured}
              />
              <FieldLabel htmlFor="isFeatured">Featured Product</FieldLabel>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                name="isPublished"
                defaultChecked={editingProduct?.isPublished ?? true}
              />
              <FieldLabel htmlFor="isPublished">Public Product</FieldLabel>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState}>
                Cancel
              </Button>
              <Button type="submit" disabled={availableSizes.length === 0}>
                {editingProduct ? "Update" : "Create"} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
