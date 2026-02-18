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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Images, Pencil, Plus, Trash2 } from "lucide-react";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";
import { resolveImageSrc } from "@/lib/image";
import { AdminMediaUploader } from "@/components/admin/media-uploader";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";

interface VariantItem {
  _id: string;
  skuVariant: string;
  productName: string;
  colorName: string;
  sizeName: string;
}

interface MediaItem {
  _id: string;
  variantId: string;
  mediaType: "image" | "video";
  filePath: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
  productName: string;
  variantSku: string;
  colorName: string;
  sizeName: string;
}

const mediaSchema = z.object({
  variantId: z.string().min(1, "Variant is required"),
  mediaType: z.enum(["image", "video"]),
  filePath: z.string().trim().min(1, "Please upload a file or enter storage id"),
  fileUrl: z.string().trim().max(1000, "File URL is too long").optional(),
  thumbnailUrl: z.string().trim().max(1000, "Thumbnail URL is too long").optional(),
  altText: z.string().trim().max(255, "Alt text is too long").optional(),
  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order must be 0 or greater"),
});

export default function MediaPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadedPreviews, setUploadedPreviews] = useState<Record<string, string>>({});
  const [fileUrl, setFileUrl] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const mediaItems = useQuery(api.media.getAll, {});
  const variants = useQuery(api.variants.getAll, { limit: 200 });

  const createMedia = useMutation(api.media.create);
  const updateMedia = useMutation(api.media.update);
  const removeMedia = useMutation(api.media.remove);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const variantOptions = (variants || []) as VariantItem[];

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingMedia(null);
    setSelectedVariantId("");
    setMediaType("image");
    setIsPrimary(false);
    setUploadedFiles([]);
    setUploadedPreviews({});
    setFileUrl("");
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingMedia(null);
    setSelectedVariantId(variantOptions[0]?._id || "");
    setMediaType("image");
    setIsPrimary(false);
    setUploadedFiles([]);
    setUploadedPreviews({});
    setFileUrl("");
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (media: MediaItem) => {
    setEditingMedia(media);
    setSelectedVariantId(media.variantId);
    setMediaType(media.mediaType);
    setIsPrimary(media.isPrimary);
    setUploadedFiles([media.filePath]);
    setUploadedPreviews({
      [media.filePath]: resolveImageSrc(media.fileUrl || media.filePath),
    });
    setFileUrl(media.fileUrl || "");
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const filePath = uploadedFiles[0] || "";

    const parsed = mediaSchema.safeParse({
      variantId: selectedVariantId,
      mediaType,
      filePath,
      fileUrl: fileUrl.trim() || undefined,
      thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || undefined,
      altText: String(formData.get("altText") ?? "").trim() || undefined,
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
      if (editingMedia) {
        await updateMedia({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: editingMedia._id as any,
          updates: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variantId: data.variantId as any,
            mediaType: data.mediaType,
            filePath: data.filePath,
            fileUrl: data.fileUrl,
            thumbnailUrl: data.thumbnailUrl,
            altText: data.altText,
            displayOrder: data.displayOrder,
            isPrimary,
          },
        });
        notify.updated("Media");
      } else {
        await createMedia({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          variantId: data.variantId as any,
          mediaType: data.mediaType,
          filePath: data.filePath,
          fileUrl: data.fileUrl,
          thumbnailUrl: data.thumbnailUrl,
          altText: data.altText,
          displayOrder: data.displayOrder,
          isPrimary,
        });
        notify.created("Media");
      }

      resetDialogState();
    } catch (error) {
      notify.actionError("save media", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media item?")) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeMedia({ id: id as any });
      notify.deleted("Media");
    } catch (error) {
      notify.actionError("delete media", error);
    }
  };

  const handleBulkDelete = async (rows: MediaItem[]) => {
    if (rows.length === 0) return;
    if (!confirm(`Delete ${rows.length} selected media item(s)?`)) return;

    let deletedCount = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await removeMedia({ id: row._id as any });
        deletedCount += 1;
      } catch (error) {
        notify.actionError(`delete media "${row.filePath}"`, error);
      }
    }

    if (deletedCount > 0) {
      notify.success(`${deletedCount} media item(s) deleted successfully`);
    }
  };

  if (mediaItems === undefined || variants === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Media</h1>
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
        <h1 className="text-3xl font-bold">Media</h1>
      </div>

      <AdminDataTable
        data={mediaItems as MediaItem[]}
        getRowId={(media) => media._id}
        emptyTitle="Empty"
        emptyDescription="No media found."
        emptyIcon={Images}
        searchPlaceholder="Filter media..."
        toolbarActions={[
          {
            label: "Create Media",
            icon: Plus,
            onClick: openCreate,
          },
        ]}
        rowActions={(media) => [
          {
            label: "Update",
            icon: Pencil,
            onClick: () => openEdit(media),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => handleDelete(media._id),
          },
        ]}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Delete selected media"
        columns={[
          {
            id: "preview",
            header: "Preview",
            headerClassName: "w-[84px]",
            searchable: false,
            cell: (media) => (
              <div className="h-12 w-12 rounded border overflow-hidden bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {media.mediaType === "image" ? (
                  <img
                    src={resolveImageSrc(media.fileUrl || media.filePath)}
                    alt={media.altText || "media"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "Video"
                )}
              </div>
            ),
          },
          {
            id: "product",
            header: "Product",
            searchAccessor: (media) =>
              `${media.productName} ${media.variantSku} ${media.colorName} ${media.sizeName}`,
            cell: (media) => <span className="font-medium">{media.productName}</span>,
          },
          {
            id: "variant",
            header: "Variant",
            searchAccessor: (media) => `${media.colorName} ${media.sizeName}`,
            cell: (media) => (
              <span className="text-sm text-muted-foreground">
                {media.colorName}/{media.sizeName}
              </span>
            ),
          },
          {
            id: "type",
            header: "Type",
            searchAccessor: (media) => media.mediaType,
            cell: (media) => (
              <span className="uppercase text-xs tracking-wide text-muted-foreground">
                {media.mediaType}
              </span>
            ),
          },
          {
            id: "primary",
            header: "Primary",
            searchAccessor: (media) => (media.isPrimary ? "yes" : "no"),
            cell: (media) => (media.isPrimary ? "Yes" : "No"),
          },
          {
            id: "filePath",
            header: "Storage ID",
            defaultHidden: true,
            searchAccessor: (media) => media.filePath,
            cell: (media) => (
              <span className="max-w-[240px] truncate text-sm text-muted-foreground">
                {media.filePath}
              </span>
            ),
          },
          { id: "order", header: "Order", cell: (media) => media.displayOrder },
        ] satisfies AdminTableColumn<MediaItem>[]}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMedia ? "Edit Media" : "Add Media"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.variantId)}>
                <FieldLabel>Variant *</FieldLabel>
                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                  <SelectTrigger aria-invalid={Boolean(formErrors.variantId)}>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {variantOptions.map((variant) => (
                      <SelectItem key={variant._id} value={variant._id}>
                        {variant.productName} / {variant.colorName} / {variant.sizeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription className={!formErrors.variantId ? "invisible" : undefined}>
                  {formErrors.variantId ?? " "}
                </FieldDescription>
              </Field>

              <Field invalid={Boolean(formErrors.mediaType)}>
                <FieldLabel>Media Type *</FieldLabel>
                <Select
                  value={mediaType}
                  onValueChange={(v) => setMediaType(v as "image" | "video")}
                >
                  <SelectTrigger aria-invalid={Boolean(formErrors.mediaType)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription className={!formErrors.mediaType ? "invisible" : undefined}>
                  {formErrors.mediaType ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <div className="space-y-2">
              <AdminMediaUploader
                label="Upload File"
                files={uploadedFiles}
                previews={uploadedPreviews}
                onFilesChange={setUploadedFiles}
                onPreviewsChange={setUploadedPreviews}
                requestUploadUrl={() => generateUploadUrl({})}
                accept={mediaType === "image" ? "image/*" : "video/*"}
                multiple={false}
                maxFiles={1}
                previewKind={mediaType === "video" ? "video" : "image"}
                compressImages={mediaType === "image"}
                successMessage="Media uploaded successfully"
              />
              <p className="text-xs text-muted-foreground">
                Media uploads are auto-linked to all variants with the same
                product + color (all sizes).
              </p>
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.filePath)}>
                <FieldLabel htmlFor="filePath">File Path / Storage ID *</FieldLabel>
                <Input
                  id="filePath"
                  value={uploadedFiles[0] || ""}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    setUploadedFiles(value ? [value] : []);
                    if (!value) {
                      setUploadedPreviews({});
                    }
                  }}
                  aria-invalid={Boolean(formErrors.filePath)}
                  required
                />
                <FieldDescription className={!formErrors.filePath ? "invisible" : undefined}>
                  {formErrors.filePath ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.fileUrl)}>
                <FieldLabel htmlFor="fileUrl">File URL (optional)</FieldLabel>
                <Input
                  id="fileUrl"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  aria-invalid={Boolean(formErrors.fileUrl)}
                />
                <FieldDescription className={!formErrors.fileUrl ? "invisible" : undefined}>
                  {formErrors.fileUrl ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <div className="grid grid-cols-3 items-start gap-4">
              <Field invalid={Boolean(formErrors.thumbnailUrl)}>
                <FieldLabel htmlFor="thumbnailUrl">Thumbnail URL</FieldLabel>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  defaultValue={editingMedia?.thumbnailUrl}
                  aria-invalid={Boolean(formErrors.thumbnailUrl)}
                />
                <FieldDescription className={!formErrors.thumbnailUrl ? "invisible" : undefined}>
                  {formErrors.thumbnailUrl ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.altText)}>
                <FieldLabel htmlFor="altText">Alt Text</FieldLabel>
                <Input
                  id="altText"
                  name="altText"
                  defaultValue={editingMedia?.altText}
                  aria-invalid={Boolean(formErrors.altText)}
                />
                <FieldDescription className={!formErrors.altText ? "invisible" : undefined}>
                  {formErrors.altText ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.displayOrder)}>
                <FieldLabel htmlFor="displayOrder">Display Order</FieldLabel>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  defaultValue={editingMedia?.displayOrder ?? 0}
                  aria-invalid={Boolean(formErrors.displayOrder)}
                />
                <FieldDescription className={!formErrors.displayOrder ? "invisible" : undefined}>
                  {formErrors.displayOrder ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch id="isPrimary" checked={isPrimary} onCheckedChange={setIsPrimary} />
                <FieldLabel htmlFor="isPrimary">Primary</FieldLabel>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState}>
                Cancel
              </Button>
              <Button type="submit">{editingMedia ? "Update" : "Create"} Media</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
