"use client";

import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
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

  const buildCategoryTree = (parentId?: string, level = 0) => {
    const children = (categories as Category[] | undefined)?.filter((c: Category) =>
      parentId ? c.parentId === parentId : !c.parentId
    ) || [];

    return children
      .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder)
      .map((category: Category) => (
        <div key={category._id}>
          <div
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{category.name}</span>
                <span className="text-sm text-muted-foreground">({category.slug})</span>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingCategory(category);
                  setFormErrors({});
                  setIsAddDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(category._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {buildCategoryTree(category._id, level + 1)}
        </div>
      ));
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setFormErrors({});
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FolderTree className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No categories found</p>
            </div>
          ) : (
            <div className="divide-y">{buildCategoryTree()}</div>
          )}
        </CardContent>
      </Card>

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
