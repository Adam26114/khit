"use client"

import { useCallback } from "react"
import { Trash2, ChevronDown, Palette, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ImageDropzone } from "@/components/image-dropzone"
import { SizeSelector } from "@/components/size-selector"
import { StockGrid } from "@/components/stock-grid"
import { SizeMeasurementsInput } from "@/components/size-measurements"
import { SizeChartPreview } from "@/components/size-chart-preview"
import { cn } from "@/lib/utils"
import type { ColorVariant, ImageFile, Size, MeasurementField } from "@/lib/product-types"

interface CopySourceVariant {
  id: string
  colorName: string
}

interface VariantCardProps {
  variant: ColorVariant
  index: number
  isOpen: boolean
  onToggleOpen: () => void
  onUpdate: (updated: ColorVariant) => void
  onRemove: () => void
  canRemove: boolean
  copySourceVariants: CopySourceVariant[]
  onCopyMeasurements: (sourceVariantId: string) => void
}

export function VariantCard({
  variant,
  index,
  isOpen,
  onToggleOpen,
  onUpdate,
  onRemove,
  canRemove,
  copySourceVariants,
  onCopyMeasurements,
}: VariantCardProps) {
  const handleColorNameChange = useCallback(
    (name: string) => onUpdate({ ...variant, colorName: name }),
    [variant, onUpdate]
  )

  const handleColorHexChange = useCallback(
    (hex: string) => onUpdate({ ...variant, colorHex: hex }),
    [variant, onUpdate]
  )

  const handleImagesAdd = useCallback(
    (newImages: ImageFile[]) =>
      onUpdate({ ...variant, images: [...variant.images, ...newImages] }),
    [variant, onUpdate]
  )

  const handleImageRemove = useCallback(
    (id: string) =>
      onUpdate({
        ...variant,
        images: variant.images.filter((img) => img.id !== id),
      }),
    [variant, onUpdate]
  )

  const handleSizeToggle = useCallback(
    (size: Size) => {
      const isSelected = variant.selectedSizes.includes(size)
      const selectedSizes = isSelected
        ? variant.selectedSizes.filter((s) => s !== size)
        : [...variant.selectedSizes, size]

      const stock = { ...variant.stock }
      const measurements = { ...variant.measurements }
      if (isSelected) {
        delete stock[size]
        delete measurements[size]
      }

      onUpdate({ ...variant, selectedSizes, stock, measurements })
    },
    [variant, onUpdate]
  )

  const handleStockChange = useCallback(
    (size: Size, qty: number) =>
      onUpdate({ ...variant, stock: { ...variant.stock, [size]: qty } }),
    [variant, onUpdate]
  )

  const handleMeasurementChange = useCallback(
    (size: Size, field: MeasurementField, value: number | undefined) => {
      const sizeMeasurements = { ...(variant.measurements[size] ?? {}) }
      if (value === undefined) {
        delete sizeMeasurements[field]
      } else {
        sizeMeasurements[field] = value
      }
      onUpdate({
        ...variant,
        measurements: { ...variant.measurements, [size]: sizeMeasurements },
      })
    },
    [variant, onUpdate]
  )

  const displayName = variant.colorName || `Variant ${index + 1}`
  const sizeCount = variant.selectedSizes.length
  const imageCount = variant.images.length
  const totalStock = Object.values(variant.stock).reduce(
    (sum, v) => sum + (v ?? 0),
    0
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card transition-colors">
      {/* Collapsed Header */}
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 sm:px-5"
      >
        {/* Color swatch */}
        <span
          className="size-5 shrink-0 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: variant.colorHex }}
          aria-hidden="true"
        />

        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          {sizeCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {sizeCount} {sizeCount === 1 ? "size" : "sizes"}
            </Badge>
          )}
          {imageCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {imageCount} {imageCount === 1 ? "image" : "images"}
            </Badge>
          )}
          {totalStock > 0 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {totalStock} units
            </Badge>
          )}
        </span>

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t border-border px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-6">
            {/* Color Name + Hex */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`color-name-${variant.id}`}>
                  <Palette className="size-3.5 text-muted-foreground" />
                  Color name
                </Label>
                <Input
                  id={`color-name-${variant.id}`}
                  placeholder="e.g. Midnight Black"
                  value={variant.colorName}
                  onChange={(e) => handleColorNameChange(e.target.value)}
                  className="bg-secondary text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`color-hex-${variant.id}`}>Swatch</Label>
                <div className="flex items-center gap-2">
                  <label
                    className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border"
                    style={{ backgroundColor: variant.colorHex }}
                  >
                    <input
                      id={`color-hex-${variant.id}`}
                      type="color"
                      value={variant.colorHex}
                      onChange={(e) => handleColorHexChange(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span className="sr-only">Pick color</span>
                  </label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {variant.colorHex.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Images */}
            <div className="flex flex-col gap-2">
              <Label>Product images</Label>
              <ImageDropzone
                images={variant.images}
                onAdd={handleImagesAdd}
                onRemove={handleImageRemove}
              />
            </div>

            <Separator />

            {/* Sizes */}
            <div className="flex flex-col gap-2">
              <Label>Available sizes</Label>
              <p className="text-xs text-muted-foreground">
                Select which sizes are available for this color
              </p>
              <SizeSelector
                selected={variant.selectedSizes}
                onToggle={handleSizeToggle}
              />
            </div>

            {/* Stock — contextual, only shows when sizes are selected */}
            {variant.selectedSizes.length > 0 && (
              <StockGrid
                sizes={variant.selectedSizes}
                stock={variant.stock}
                onChange={handleStockChange}
              />
            )}

            {/* Measurements — only shows when sizes are selected */}
            {variant.selectedSizes.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div />
                  {copySourceVariants.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Copy className="size-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Copy from:</span>
                      {copySourceVariants.map((src) => (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => onCopyMeasurements(src.id)}
                          className="rounded border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          {src.colorName || "Unnamed"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <SizeMeasurementsInput
                  sizes={variant.selectedSizes}
                  measurements={variant.measurements}
                  onChange={handleMeasurementChange}
                />
                <SizeChartPreview
                  sizes={variant.selectedSizes}
                  measurements={variant.measurements}
                />
              </div>
            )}

            {/* Remove variant */}
            {canRemove && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Remove variant
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
