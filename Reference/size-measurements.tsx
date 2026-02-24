"use client"

import { useState } from "react"
import { ChevronDown, Ruler } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  MEASUREMENT_FIELDS,
  type MeasurementField,
  type Size,
  type SizeMeasurements as SizeMeasurementsType,
} from "@/lib/product-types"

const FIELD_LABELS: Record<MeasurementField, string> = {
  shoulder: "Shoulder",
  chest: "Chest",
  sleeve: "Sleeve",
  waist: "Waist",
  length: "Length",
}

const MEASUREMENT_LIMITS: Record<MeasurementField, { min: number; max: number }> = {
  shoulder: { min: 10, max: 30 },
  chest: { min: 28, max: 60 },
  sleeve: { min: 5, max: 40 },
  waist: { min: 20, max: 56 },
  length: { min: 15, max: 45 },
}

interface SizeMeasurementsProps {
  sizes: Size[]
  measurements: Partial<Record<Size, SizeMeasurementsType>>
  onChange: (size: Size, field: MeasurementField, value: number | undefined) => void
}

export function SizeMeasurementsInput({
  sizes,
  measurements,
  onChange,
}: SizeMeasurementsProps) {
  const [expandedSize, setExpandedSize] = useState<Size | null>(
    sizes.length > 0 ? sizes[0] : null
  )

  if (sizes.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Ruler className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Size chart (inches)
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {sizes.map((size) => {
          const isExpanded = expandedSize === size
          const sizeMeasurements = measurements[size] ?? {}
          const filledCount = MEASUREMENT_FIELDS.filter(
            (f) => sizeMeasurements[f] !== undefined && sizeMeasurements[f] !== 0
          ).length

          return (
            <div key={size} className="overflow-hidden rounded-md border border-border bg-card">
              <button
                type="button"
                onClick={() => setExpandedSize(isExpanded ? null : size)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
              >
                <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                  {size}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {filledCount === 0
                    ? "No measurements"
                    : `${filledCount}/${MEASUREMENT_FIELDS.length} filled`}
                </span>
                {filledCount === MEASUREMENT_FIELDS.length && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                    {""}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border px-3 py-3">
                  <div className="flex flex-col gap-2">
                    {MEASUREMENT_FIELDS.map((field) => {
                      const value = sizeMeasurements[field]
                      const limits = MEASUREMENT_LIMITS[field]
                      const isOutOfRange =
                        value !== undefined &&
                        value !== 0 &&
                        (value < limits.min || value > limits.max)

                      return (
                        <div
                          key={field}
                          className="flex items-center gap-3"
                        >
                          <span className="w-18 shrink-0 text-xs text-muted-foreground">
                            {FIELD_LABELS[field]}
                          </span>
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              step="0.5"
                              min={0}
                              placeholder="--"
                              value={value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value
                                if (raw === "") {
                                  onChange(size, field, undefined)
                                } else {
                                  const num = parseFloat(raw)
                                  onChange(size, field, isNaN(num) ? undefined : num)
                                }
                              }}
                              className={cn(
                                "h-8 bg-secondary text-foreground pr-12 text-xs",
                                isOutOfRange && "border-destructive focus-visible:ring-destructive"
                              )}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                              in
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {MEASUREMENT_FIELDS.some((f) => {
                    const v = sizeMeasurements[f]
                    const lim = MEASUREMENT_LIMITS[f]
                    return v !== undefined && v !== 0 && (v < lim.min || v > lim.max)
                  }) && (
                    <p className="mt-2 text-[10px] text-destructive">
                      Some values are outside typical ranges. Please verify.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
