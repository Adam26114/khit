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
import { Plus, Pencil, Trash2, Images } from "lucide-react";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";
import { resolveImageSrc } from "@/lib/image";
import { AdminMediaUploader } from "@/components/admin/media-uploader";

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
  isActive: boolean;
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
  const [isActive, setIsActive] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadedPreviews, setUploadedPreviews] = useState<Record<string, string>>({});
  const [fileUrl, setFileUrl] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const mediaItems = useQuery(api.media.getAll, { includeInactive: true });
  const variants = useQuery(api.variants.getAll, { includeInactive: true, limit: 200 });

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
    setIsActive(true);
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
    setIsActive(true);
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
    setIsActive(media.isActive);
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
            isActive,
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Media</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Media
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {mediaItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Images className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No media found</p>
            </div>
          ) : (
            <div className="divide-y">
              {(mediaItems as MediaItem[]).map((media) => (
                <div
                  key={media._id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
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
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{media.productName}</span>
                        <Badge variant="outline">{media.mediaType}</Badge>
                        {media.isPrimary && <Badge>Primary</Badge>}
                        {!media.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {media.variantSku} • {media.colorName}/{media.sizeName}
                      </p>
                      <p className="text-sm text-muted-foreground break-all">
                        {media.filePath} • Order: {media.displayOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(media)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(media._id)}>
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
            <DialogTitle>{editingMedia ? "Edit Media" : "Add Media"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                {formErrors.variantId && <FieldDescription>{formErrors.variantId}</FieldDescription>}
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
                {formErrors.mediaType && <FieldDescription>{formErrors.mediaType}</FieldDescription>}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                {formErrors.filePath && <FieldDescription>{formErrors.filePath}</FieldDescription>}
              </Field>
              <Field invalid={Boolean(formErrors.fileUrl)}>
                <FieldLabel htmlFor="fileUrl">File URL (optional)</FieldLabel>
                <Input
                  id="fileUrl"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  aria-invalid={Boolean(formErrors.fileUrl)}
                />
                {formErrors.fileUrl && <FieldDescription>{formErrors.fileUrl}</FieldDescription>}
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field invalid={Boolean(formErrors.thumbnailUrl)}>
                <FieldLabel htmlFor="thumbnailUrl">Thumbnail URL</FieldLabel>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  defaultValue={editingMedia?.thumbnailUrl}
                  aria-invalid={Boolean(formErrors.thumbnailUrl)}
                />
                {formErrors.thumbnailUrl && (
                  <FieldDescription>{formErrors.thumbnailUrl}</FieldDescription>
                )}
              </Field>
              <Field invalid={Boolean(formErrors.altText)}>
                <FieldLabel htmlFor="altText">Alt Text</FieldLabel>
                <Input
                  id="altText"
                  name="altText"
                  defaultValue={editingMedia?.altText}
                  aria-invalid={Boolean(formErrors.altText)}
                />
                {formErrors.altText && <FieldDescription>{formErrors.altText}</FieldDescription>}
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
                {formErrors.displayOrder && (
                  <FieldDescription>{formErrors.displayOrder}</FieldDescription>
                )}
              </Field>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch id="isPrimary" checked={isPrimary} onCheckedChange={setIsPrimary} />
                <FieldLabel htmlFor="isPrimary">Primary</FieldLabel>
              </div>
              {editingMedia && (
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                </div>
              )}
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
