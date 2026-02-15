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
import { Plus, Pencil, Trash2, Palette } from "lucide-react";
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

  const colors = useQuery(api.colors.getAll, { includeInactive: true });
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Colors</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Color
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {colors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Palette className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No colors found</p>
            </div>
          ) : (
            <div className="divide-y">
              {(colors as ColorItem[]).map((color) => (
                <div
                  key={color._id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 border rounded" style={{ backgroundColor: color.hexCode }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{color.name}</span>
                        {!color.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {color.hexCode} • Order: {color.displayOrder}
                        {color.nameMm ? ` • MM: ${color.nameMm}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(color)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(color._id)}>
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
