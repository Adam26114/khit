"use client";

import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";

interface SizeItem {
  _id: string;
  name: string;
  nameMm?: string;
  sizeCategory: string;
  displayOrder: number;
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const sizes = useQuery(api.sizes.getAll, {});
  const createSize = useMutation(api.sizes.create);
  const updateSize = useMutation(api.sizes.update);
  const removeSize = useMutation(api.sizes.remove);

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingSize(null);
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingSize(null);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (size: SizeItem) => {
    setEditingSize(size);
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

  const handleBulkDelete = async (rows: SizeItem[]) => {
    if (rows.length === 0) return;
    if (!confirm(`Delete ${rows.length} selected sizes?`)) return;

    let deletedCount = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await removeSize({ id: row._id as any });
        deletedCount += 1;
      } catch (error) {
        notify.actionError(`delete size "${row.name}"`, error);
      }
    }

    if (deletedCount > 0) {
      notify.success(`${deletedCount} sizes deleted successfully`);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sizes</h1>
      </div>

      <AdminDataTable
        data={sizes as SizeItem[]}
        getRowId={(size) => size._id}
        emptyTitle="Empty"
        emptyDescription="No sizes found."
        emptyIcon={Ruler}
        searchPlaceholder="Filter sizes..."
        toolbarActions={[
          {
            label: "Create Size",
            icon: Plus,
            onClick: openCreate,
          },
        ]}
        rowActions={(size) => [
          {
            label: "Update",
            icon: Pencil,
            onClick: () => openEdit(size),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => handleDelete(size._id),
          },
        ]}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Delete selected sizes"
        columns={[
          {
            id: "name",
            header: "Size",
            searchAccessor: (size) => `${size.name} ${size.nameMm ?? ""}`,
            cell: (size) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{size.name}</span>
                {size.nameMm ? <span className="text-sm text-muted-foreground">{size.nameMm}</span> : null}
              </div>
            ),
          },
          {
            id: "category",
            header: "Category",
            searchAccessor: (size) => size.sizeCategory,
            cell: (size) => size.sizeCategory,
          },
          { id: "order", header: "Order", cell: (size) => size.displayOrder },
        ] satisfies AdminTableColumn<SizeItem>[]}
      />

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
            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.name)}>
                <FieldLabel htmlFor="name">Size *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSize?.name}
                  aria-invalid={Boolean(formErrors.name)}
                  required
                />
                <FieldDescription className={!formErrors.name ? "invisible" : undefined}>
                  {formErrors.name ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.nameMm)}>
                <FieldLabel htmlFor="nameMm">Size (MM)</FieldLabel>
                <Input
                  id="nameMm"
                  name="nameMm"
                  defaultValue={editingSize?.nameMm}
                  aria-invalid={Boolean(formErrors.nameMm)}
                />
                <FieldDescription className={!formErrors.nameMm ? "invisible" : undefined}>
                  {formErrors.nameMm ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.sizeCategory)}>
                <FieldLabel htmlFor="sizeCategory">Category *</FieldLabel>
                <Input
                  id="sizeCategory"
                  name="sizeCategory"
                  defaultValue={editingSize?.sizeCategory || "apparel"}
                  aria-invalid={Boolean(formErrors.sizeCategory)}
                  required
                />
                <FieldDescription className={!formErrors.sizeCategory ? "invisible" : undefined}>
                  {formErrors.sizeCategory ?? " "}
                </FieldDescription>
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
                <FieldDescription className={!formErrors.displayOrder ? "invisible" : undefined}>
                  {formErrors.displayOrder ?? " "}
                </FieldDescription>
              </Field>
            </div>

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
