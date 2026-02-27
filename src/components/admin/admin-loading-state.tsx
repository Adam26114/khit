"use client"

import { useEffect, useState } from "react"
import { Command } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type AdminLoadingStateProps = {
  title?: string
  className?: string
  fullScreen?: boolean
  durationMs?: number
  showPercentage?: boolean
}

export function AdminLoadingState({
  title = "Loading...",
  className,
  fullScreen = true,
  durationMs = 2200,
  showPercentage = true,
}: AdminLoadingStateProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)

    if (durationMs <= 0) {
      setProgress(100)
      return
    }

    let frameId = 0
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const percentage = Math.min(100, Math.round((elapsed / durationMs) * 100))
      setProgress((prev) => (prev === percentage ? prev : percentage))

      if (percentage < 100) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [durationMs])

  return (
    <div
      className={cn(
        "flex items-center justify-center px-6 py-10",
        fullScreen ? "min-h-screen" : "min-h-[320px]",
        className
      )}
    >
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
          <Command className="h-10 w-10 text-khit-royalBlue" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight text-foreground">{title}</p>
          {showPercentage ? (
            <p className="text-sm font-medium tabular-nums text-muted-foreground">{progress}%</p>
          ) : null}
        </div>
        <Progress
          value={progress}
          max={100}
          aria-label={title}
          className="h-2 bg-muted [&>[data-slot=progress-indicator]]:bg-khit-royalBlue"
        />
      </div>
    </div>
  )
}
