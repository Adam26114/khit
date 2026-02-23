"use client"

import { useCallback, useRef } from "react"
import { ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ImageFile } from "@/lib/product-types"

interface ImageDropzoneProps {
  images: ImageFile[]
  onAdd: (files: ImageFile[]) => void
  onRemove: (id: string) => void
}

export function ImageDropzone({ images, onAdd, onRemove }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newImages: ImageFile[] = Array.from(fileList)
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          label: file.name,
        }))
      if (newImages.length > 0) onAdd(newImages)
    },
    [onAdd]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 px-6 py-8",
          "cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5",
          "text-muted-foreground"
        )}
      >
        <ImagePlus className="size-8 opacity-50" />
        <div className="text-center">
          <span className="text-sm font-medium text-foreground/80">
            Drop images here
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            or click to browse
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={img.label}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
                <span className="sr-only">Remove image</span>
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-background/70 px-1.5 py-0.5 backdrop-blur-sm">
                <p className="truncate text-[10px] text-foreground/80">
                  {img.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
