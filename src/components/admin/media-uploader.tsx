"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImageToWebP } from "@/lib/storage";
import { resolveImageSrc } from "@/lib/image";
import { notify } from "@/lib/notifications";

interface AdminMediaUploaderProps {
  label: string;
  files: string[];
  previews: Record<string, string>;
  onFilesChange: (files: string[]) => void;
  onPreviewsChange: (previews: Record<string, string>) => void;
  requestUploadUrl: () => Promise<string>;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  previewKind?: "image" | "video";
  compressImages?: boolean;
  successMessage?: string;
}

export function AdminMediaUploader({
  label,
  files,
  previews,
  onFilesChange,
  onPreviewsChange,
  requestUploadUrl,
  accept = "image/*",
  multiple = false,
  maxFiles,
  previewKind = "image",
  compressImages = true,
  successMessage = "Upload successful",
}: AdminMediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const picked = multiple ? Array.from(selected) : [selected[0]];
    const room =
      typeof maxFiles === "number"
        ? Math.max(0, maxFiles - files.length)
        : picked.length;
    const queue = picked.slice(0, room);

    if (queue.length === 0) {
      notify.error(`You can upload up to ${maxFiles} file(s).`);
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      const nextFiles = multiple ? [...files] : [];
      const nextPreviews = multiple ? { ...previews } : {};

      if (!multiple) {
        Object.values(previews).forEach((url) => {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        });
      }

      for (const file of queue) {
        const shouldCompress =
          compressImages &&
          previewKind !== "video" &&
          file.type.startsWith("image/");

        const uploadFile = shouldCompress
          ? await compressImageToWebP(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.85,
            })
          : file;

        const uploadUrl = await requestUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": uploadFile.type },
          body: uploadFile,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = await response.json();
        nextFiles.push(storageId);
        nextPreviews[storageId] = URL.createObjectURL(uploadFile);
      }

      onFilesChange(nextFiles);
      onPreviewsChange(nextPreviews);
      notify.success(successMessage);
    } catch (error) {
      notify.actionError("upload file", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const targetId = files[index];
    const targetPreview = previews[targetId];
    if (targetPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(targetPreview);
    }

    const nextFiles = files.filter((_, i) => i !== index);
    const nextPreviews = { ...previews };
    delete nextPreviews[targetId];

    onFilesChange(nextFiles);
    onPreviewsChange(nextPreviews);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleUpload}
          disabled={isUploading}
          className="flex-1"
        />
        {files.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {files.length} file(s)
          </span>
        )}
      </div>
      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3 pt-2">
          {files.map((fileId, index) => {
            const src = previews[fileId] || resolveImageSrc(fileId);
            return (
              <div
                key={`${fileId}-${index}`}
                className="relative aspect-square overflow-hidden rounded border bg-muted"
              >
                {previewKind === "video" ? (
                  <video
                    src={src}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={src}
                    alt={`Uploaded file ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
