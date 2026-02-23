"use client"

import { useState } from "react"
import { ChevronDown, TableProperties } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  MEASUREMENT_FIELDS,
  type MeasurementField,
  type Size,
  type SizeMeasurements,
} from "@/lib/product-types"

const FIELD_LABELS: Record<MeasurementField, string> = {
  shoulder: "Shoulder",
  chest: "Chest",
  sleeve: "Sleeve",
  waist: "Waist",
  length: "Length",
}

interface SizeChartPreviewProps {
  sizes: Size[]
  measurements: Partial<Record<Size, SizeMeasurements>>
}

export function SizeChartPreview({ sizes, measurements }: SizeChartPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (sizes.length === 0) return null

  const hasAnyData = sizes.some((size) => {
    const m = measurements[size]
    return m && MEASUREMENT_FIELDS.some((f) => m[f] !== undefined && m[f] !== 0)
  })

  return (
    <div className="rounded-lg border border-border bg-secondary/40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-accent/50"
      >
        <TableProperties className="size-3.5 text-muted-foreground" />
        <span className="flex-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Preview Size Chart
        </span>
        {!hasAnyData && (
          <span className="text-[10px] text-muted-foreground/60">No data yet</span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Size
                  </th>
                  {MEASUREMENT_FIELDS.map((field) => (
                    <th
                      key={field}
                      className="px-2 py-2 text-right font-medium text-muted-foreground"
                    >
                      {FIELD_LABELS[field]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => {
                  const m = measurements[size] ?? {}
                  return (
                    <tr key={size} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-2 font-semibold text-foreground">
                        {size}
                      </td>
                      {MEASUREMENT_FIELDS.map((field) => {
                        const val = m[field]
                        return (
                          <td
                            key={field}
                            className={cn(
                              "px-2 py-2 text-right tabular-nums",
                              val !== undefined && val !== 0
                                ? "text-foreground"
                                : "text-muted-foreground/40"
                            )}
                          >
                            {val !== undefined && val !== 0 ? val : "\u2014"}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            All values in inches. Backend will convert to cm automatically.
          </p>
        </div>
      )}
    </div>
  )
}
