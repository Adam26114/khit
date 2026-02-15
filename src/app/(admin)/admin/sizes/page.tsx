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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";

interface SizeItem {
  _id: string;
  name: string;
  nameMm?: string;
  sizeCategory: string;
  displayOrder: number;
  isActive: boolean;
}

const sizeSchema = z.object({
  name: z.string().trim().min(1, "Size is required").max(20, "Size is too long"),
  nameMm: z.string().trim().max(40, "Myanmar size is too long").optional(),
  sizeCategory: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category is too long"),
  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order must be 0 or greater"),
});

export default function SizesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<SizeItem | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const sizes = useQuery(api.sizes.getAll, { includeInactive: true });
  const createSize = useMutation(api.sizes.create);
  const updateSize = useMutation(api.sizes.update);
  const removeSize = useMutation(api.sizes.remove);

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingSize(null);
    setIsActive(true);
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingSize(null);
    setIsActive(true);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (size: SizeItem) => {
    setEditingSize(size);
    setIsActive(size.isActive);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const parsed = sizeSchema.safeParse({
      name: String(formData.get("name") ?? "").trim().toUpperCase(),
      nameMm: String(formData.get("nameMm") ?? "").trim() || undefined,
      sizeCategory: String(formData.get("sizeCategory") ?? "").trim(),
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
      if (editingSize) {
        await updateSize({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: editingSize._id as any,
          updates: {
            name: data.name,
            nameMm: data.nameMm,
            sizeCategory: data.sizeCategory,
            displayOrder: data.displayOrder,
            isActive,
          },
        });
        notify.updated("Size");
      } else {
        await createSize({
          name: data.name,
          nameMm: data.nameMm,
          sizeCategory: data.sizeCategory,
          displayOrder: data.displayOrder,
        });
        notify.created("Size");
      }

      resetDialogState();
    } catch (error) {
      notify.actionError("save size", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this size?")) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeSize({ id: id as any });
      notify.deleted("Size");
    } catch (error) {
      notify.actionError("delete size", error);
    }
  };

  if (sizes === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Sizes</h1>
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
        <h1 className="text-3xl font-bold">Sizes</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Size
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {sizes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Ruler className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No sizes found</p>
            </div>
          ) : (
            <div className="divide-y">
              {(sizes as SizeItem[]).map((size) => (
                <div
                  key={size._id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{size.name}</span>
                      {!size.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Category: {size.sizeCategory} • Order: {size.displayOrder}
                      {size.nameMm ? ` • MM: ${size.nameMm}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(size)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(size._id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSize ? "Edit Size" : "Add Size"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field invalid={Boolean(formErrors.name)}>
                <FieldLabel htmlFor="name">Size *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSize?.name}
                  aria-invalid={Boolean(formErrors.name)}
                  required
                />
                {formErrors.name && <FieldDescription>{formErrors.name}</FieldDescription>}
              </Field>
              <Field invalid={Boolean(formErrors.nameMm)}>
                <FieldLabel htmlFor="nameMm">Size (MM)</FieldLabel>
                <Input
                  id="nameMm"
                  name="nameMm"
                  defaultValue={editingSize?.nameMm}
                  aria-invalid={Boolean(formErrors.nameMm)}
                />
                {formErrors.nameMm && <FieldDescription>{formErrors.nameMm}</FieldDescription>}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field invalid={Boolean(formErrors.sizeCategory)}>
                <FieldLabel htmlFor="sizeCategory">Category *</FieldLabel>
                <Input
                  id="sizeCategory"
                  name="sizeCategory"
                  defaultValue={editingSize?.sizeCategory || "apparel"}
                  aria-invalid={Boolean(formErrors.sizeCategory)}
                  required
                />
                {formErrors.sizeCategory && (
                  <FieldDescription>{formErrors.sizeCategory}</FieldDescription>
                )}
              </Field>
              <Field invalid={Boolean(formErrors.displayOrder)}>
                <FieldLabel htmlFor="displayOrder">Display Order</FieldLabel>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  defaultValue={editingSize?.displayOrder ?? 0}
                  aria-invalid={Boolean(formErrors.displayOrder)}
                />
                {formErrors.displayOrder && (
                  <FieldDescription>{formErrors.displayOrder}</FieldDescription>
                )}
              </Field>
            </div>

            {editingSize && (
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <FieldLabel htmlFor="isActive">Active</FieldLabel>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState}>
                Cancel
              </Button>
              <Button type="submit">{editingSize ? "Update" : "Create"} Size</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
