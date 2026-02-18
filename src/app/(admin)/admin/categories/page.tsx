"use client";

import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

type CategoryRow = Category & { level: number };

const ROOT_CATEGORY_VALUE = "__root__";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name is too long"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce
    .number()
    .int("Sort order must be a whole number")
    .min(0, "Sort order must be 0 or greater"),
});

export default function CategoriesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const categories = useQuery(api.categories.getActive);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const resetDialogState = () => {
    setIsAddDialogOpen(false);
    setEditingCategory(null);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parentIdRaw = formData.get("parentId");

    const parsed = categorySchema.safeParse({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? "").trim() || undefined,
      parentId:
        typeof parentIdRaw === "string" && parentIdRaw !== ROOT_CATEGORY_VALUE
          ? parentIdRaw
          : undefined,
      sortOrder: formData.get("sortOrder") ?? "0",
    });

    if (!parsed.success) {
      setFormErrors(zodToFormErrors(parsed.error));
      notify.validation();
      return;
    }

    setFormErrors({});
    const data = parsed.data;

    try {
      if (editingCategory) {
        await updateCategory({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: editingCategory._id as any,
          updates: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parentId: data.parentId ? (data.parentId as any) : undefined,
            sortOrder: data.sortOrder,
          },
        });
        notify.updated("Category");
      } else {
        await createCategory({
          name: data.name,
          slug: data.slug,
          description: data.description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parentId: data.parentId ? (data.parentId as any) : undefined,
          sortOrder: data.sortOrder,
        });
        notify.created("Category");
      }
      resetDialogState();
    } catch (error) {
      notify.actionError("save category", error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeCategory({ id: categoryId as any });
      notify.deleted("Category");
    } catch (error) {
      notify.actionError("delete category", error);
    }
  };

  const handleBulkDelete = async (rows: CategoryRow[]) => {
    if (rows.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${rows.length} selected categories?`)) return;

    let deletedCount = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await removeCategory({ id: row._id as any });
        deletedCount += 1;
      } catch (error) {
        notify.actionError(`delete category "${row.name}"`, error);
      }
    }

    if (deletedCount > 0) {
      notify.success(`${deletedCount} categories deleted successfully`);
    }
  };

  const flattenCategoryTree = (parentId?: string, level = 0): CategoryRow[] => {
    const children = (categories as Category[] | undefined)?.filter((c: Category) =>
      parentId ? c.parentId === parentId : !c.parentId
    ) || [];

    return children
      .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder)
      .flatMap((category: Category) => [
        { ...category, level },
        ...flattenCategoryTree(category._id, level + 1),
      ]);
  };

  if (categories === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const categoryRows = flattenCategoryTree();
  const categoryById = new Map((categories as Category[]).map((category) => [category._id, category]));

  const columns: AdminTableColumn<CategoryRow>[] = [
    {
      id: "name",
      header: "Name",
      searchAccessor: (category) =>
        `${category.name} ${category.slug} ${category.description ?? ""}`,
      cell: (category) => (
        <div style={{ paddingLeft: `${category.level * 18}px` }} className="font-medium">
          {category.name}
        </div>
      ),
    },
    {
      id: "slug",
      header: "Slug",
      defaultHidden: true,
      searchAccessor: (category) => category.slug,
      cell: (category) => <span className="text-sm text-muted-foreground">{category.slug}</span>,
    },
    {
      id: "parent",
      header: "Parent",
      searchAccessor: (category) =>
        category.parentId ? categoryById.get(category.parentId)?.name || "unknown" : "root",
      cell: (category) => (
        <span className="text-sm text-muted-foreground">
          {category.parentId ? categoryById.get(category.parentId)?.name || "Unknown" : "Root"}
        </span>
      ),
    },
    {
      id: "order",
      header: "Order",
      cell: (category) => category.sortOrder,
      cellClassName: "text-sm",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      <AdminDataTable
        data={categoryRows}
        columns={columns}
        getRowId={(category) => category._id}
        emptyTitle="Empty"
        emptyDescription="No categories found."
        emptyIcon={FolderTree}
        searchPlaceholder="Filter categories..."
        toolbarActions={[
          {
            label: "Create Category",
            icon: Plus,
            onClick: () => {
              setEditingCategory(null);
              setFormErrors({});
              setIsAddDialogOpen(true);
            },
          },
        ]}
        rowActions={(category) => [
          {
            label: "Update",
            icon: Pencil,
            onClick: () => {
              setEditingCategory(category);
              setFormErrors({});
              setIsAddDialogOpen(true);
            },
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => handleDelete(category._id),
          },
        ]}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Delete selected categories"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.name)}>
                <FieldLabel htmlFor="name">Category Name *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCategory?.name}
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
                  defaultValue={editingCategory?.slug}
                  aria-invalid={Boolean(formErrors.slug)}
                  required
                />
                <FieldDescription className={!formErrors.slug ? "invisible" : undefined}>
                  {formErrors.slug ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <Field invalid={Boolean(formErrors.description)}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description}
                aria-invalid={Boolean(formErrors.description)}
                rows={3}
              />
              <FieldDescription className={!formErrors.description ? "invisible" : undefined}>
                {formErrors.description ?? " "}
              </FieldDescription>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="parentId">Parent Category</FieldLabel>
                <Select
                  name="parentId"
                  defaultValue={editingCategory?.parentId || ROOT_CATEGORY_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Root)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT_CATEGORY_VALUE}>None (Root)</SelectItem>
                    {(categories as Category[] | undefined)
                      ?.filter((c: Category) => c._id !== editingCategory?._id)
                      .map((category: Category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field invalid={Boolean(formErrors.sortOrder)}>
                <FieldLabel htmlFor="sortOrder">Sort Order</FieldLabel>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue={editingCategory?.sortOrder ?? 0}
                  aria-invalid={Boolean(formErrors.sortOrder)}
                />
                <FieldDescription className={!formErrors.sortOrder ? "invisible" : undefined}>
                  {formErrors.sortOrder ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState}>
                Cancel
              </Button>
              <Button type="submit">{editingCategory ? "Update" : "Create"} Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
