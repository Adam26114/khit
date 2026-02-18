"use client";

import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";

interface ColorItem {
  _id: string;
  name: string;
  nameMm?: string;
  hexCode: string;
  displayOrder: number;
  isActive: boolean;
}

const colorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  nameMm: z.string().trim().max(60, "Myanmar name is too long").optional(),
  hexCode: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Hex code must be in #RGB or #RRGGBB format"),
  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order must be 0 or greater"),
});

export default function ColorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorItem | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [hexCodeValue, setHexCodeValue] = useState("#111111");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const colors = useQuery(api.colors.getAll, {});
  const createColor = useMutation(api.colors.create);
  const updateColor = useMutation(api.colors.update);
  const removeColor = useMutation(api.colors.remove);

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingColor(null);
    setIsActive(true);
    setHexCodeValue("#111111");
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingColor(null);
    setIsActive(true);
    setHexCodeValue("#111111");
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (color: ColorItem) => {
    setEditingColor(color);
    setIsActive(color.isActive);
    setHexCodeValue(color.hexCode || "#111111");
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const normalizedHex = (hexCodeValue || "").trim();
    const hexCode = normalizedHex.startsWith("#") ? normalizedHex : `#${normalizedHex}`;

    const parsed = colorSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      nameMm: String(formData.get("nameMm") ?? "").trim() || undefined,
      hexCode,
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
      if (editingColor) {
        await updateColor({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: editingColor._id as any,
          updates: {
            name: data.name,
            nameMm: data.nameMm,
            hexCode: data.hexCode,
            displayOrder: data.displayOrder,
            isActive,
          },
        });
        notify.updated("Color");
      } else {
        await createColor({
          name: data.name,
          nameMm: data.nameMm,
          hexCode: data.hexCode,
          displayOrder: data.displayOrder,
        });
        notify.created("Color");
      }

      resetDialogState();
    } catch (error) {
      notify.actionError("save color", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this color?")) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeColor({ id: id as any });
      notify.deleted("Color");
    } catch (error) {
      notify.actionError("delete color", error);
    }
  };

  const handleBulkDelete = async (rows: ColorItem[]) => {
    if (rows.length === 0) return;
    if (!confirm(`Delete ${rows.length} selected colors?`)) return;

    let deletedCount = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await removeColor({ id: row._id as any });
        deletedCount += 1;
      } catch (error) {
        notify.actionError(`delete color "${row.name}"`, error);
      }
    }

    if (deletedCount > 0) {
      notify.success(`${deletedCount} colors deleted successfully`);
    }
  };

  if (colors === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Colors</h1>
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
        <h1 className="text-3xl font-bold">Colors</h1>
      </div>

      <AdminDataTable
        data={colors as ColorItem[]}
        getRowId={(color) => color._id}
        emptyTitle="Empty"
        emptyDescription="No colors found."
        emptyIcon={Palette}
        searchPlaceholder="Filter colors..."
        toolbarActions={[
          {
            label: "Create Color",
            icon: Plus,
            onClick: openCreate,
          },
        ]}
        rowActions={(color) => [
          {
            label: "Update",
            icon: Pencil,
            onClick: () => openEdit(color),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => handleDelete(color._id),
          },
        ]}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Delete selected colors"
        columns={[
          {
            id: "name",
            header: "Name",
            searchAccessor: (color) => `${color.name} ${color.nameMm ?? ""}`,
            cell: (color) => (
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 shrink-0 rounded border"
                  style={{ backgroundColor: color.hexCode }}
                />
                <span className="font-medium">{color.name}</span>
                {color.nameMm ? <span className="text-sm text-muted-foreground">{color.nameMm}</span> : null}
              </div>
            ),
          },
          {
            id: "hex",
            header: "Hex Code",
            searchAccessor: (color) => color.hexCode,
            cell: (color) => <span className="font-mono text-sm">{color.hexCode}</span>,
          },
          {
            id: "order",
            header: "Order",
            cell: (color) => color.displayOrder,
          },
          {
            id: "active",
            header: "Active",
            defaultHidden: true,
            searchAccessor: (color) => (color.isActive ? "active" : "inactive"),
            cell: (color) => (color.isActive ? "Yes" : "No"),
          },
        ] satisfies AdminTableColumn<ColorItem>[]}
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
            <DialogTitle>{editingColor ? "Edit Color" : "Add Color"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.name)}>
                <FieldLabel htmlFor="name">Name *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingColor?.name}
                  aria-invalid={Boolean(formErrors.name)}
                  required
                />
                <FieldDescription className={!formErrors.name ? "invisible" : undefined}>
                  {formErrors.name ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.nameMm)}>
                <FieldLabel htmlFor="nameMm">Name (MM)</FieldLabel>
                <Input
                  id="nameMm"
                  name="nameMm"
                  defaultValue={editingColor?.nameMm}
                  aria-invalid={Boolean(formErrors.nameMm)}
                />
                <FieldDescription className={!formErrors.nameMm ? "invisible" : undefined}>
                  {formErrors.nameMm ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.hexCode)}>
                <FieldLabel htmlFor="hexCode" className="flex items-center gap-2">
                  <span>Hex Code *</span>
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <span
                      className="h-3.5 w-3.5 rounded border"
                      style={{ backgroundColor: hexCodeValue }}
                    />
                    {hexCodeValue}
                  </span>
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="hexCode"
                    name="hexCode"
                    value={hexCodeValue}
                    onChange={(e) => setHexCodeValue(e.target.value)}
                    aria-invalid={Boolean(formErrors.hexCode)}
                    required
                  />
                  <Input
                    type="color"
                    value={hexCodeValue}
                    onChange={(e) => setHexCodeValue(e.target.value)}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                </div>
                <FieldDescription className={!formErrors.hexCode ? "invisible" : undefined}>
                  {formErrors.hexCode ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.displayOrder)}>
                <FieldLabel htmlFor="displayOrder">Display Order</FieldLabel>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  defaultValue={editingColor?.displayOrder ?? 0}
                  aria-invalid={Boolean(formErrors.displayOrder)}
                />
                <FieldDescription className={!formErrors.displayOrder ? "invisible" : undefined}>
                  {formErrors.displayOrder ?? " "}
                </FieldDescription>
              </Field>
            </div>

            {editingColor && (
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <FieldLabel htmlFor="isActive">Active</FieldLabel>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState}>
                Cancel
              </Button>
              <Button type="submit">{editingColor ? "Update" : "Create"} Color</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
