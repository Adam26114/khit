"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { X, Plus, Check, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_CATEGORIES } from "@/lib/product-types"

interface CategorySelectorProps {
  selected: string[]
  onChange: (categories: string[]) => void
}

export function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter(
      (c) => !DEFAULT_CATEGORIES.map((d) => d.toLowerCase()).includes(c.toLowerCase())
    ),
  ]

  const filteredSuggestions = allCategories.filter(
    (cat) =>
      cat.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selected.map((s) => s.toLowerCase()).includes(cat.toLowerCase())
  )

  const exactMatch = allCategories.some(
    (cat) => cat.toLowerCase() === inputValue.trim().toLowerCase()
  )

  const canCreate =
    inputValue.trim().length > 0 &&
    !exactMatch &&
    !selected
      .map((s) => s.toLowerCase())
      .includes(inputValue.trim().toLowerCase())

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addCategory = useCallback(
    (category: string) => {
      if (!selected.map((s) => s.toLowerCase()).includes(category.toLowerCase())) {
        onChange([...selected, category])
      }
      setInputValue("")
      inputRef.current?.focus()
    },
    [selected, onChange]
  )

  const removeCategory = useCallback(
    (category: string) => {
      onChange(selected.filter((c) => c !== category))
    },
    [selected, onChange]
  )

  const createAndAdd = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed && canCreate) {
      setCustomCategories((prev) => [...prev, trimmed])
      addCategory(trimmed)
    }
  }, [inputValue, canCreate, addCategory])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (canCreate) {
        createAndAdd()
      } else if (filteredSuggestions.length > 0) {
        addCategory(filteredSuggestions[0])
      }
    }
    if (e.key === "Backspace" && inputValue === "" && selected.length > 0) {
      removeCategory(selected[selected.length - 1])
    }
    if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      {/* Selected categories as badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="gap-1 py-1 pl-2.5 pr-1.5 text-xs"
            >
              <Tag className="size-3 text-muted-foreground" />
              {cat}
              <button
                type="button"
                onClick={() => removeCategory(cat)}
                className="ml-0.5 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground"
                aria-label={`Remove ${cat}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={
            selected.length > 0
              ? "Add more categories..."
              : "Search or create a category..."
          }
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="bg-secondary text-foreground"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
      </div>

      {/* Dropdown suggestions */}
      {isOpen && (filteredSuggestions.length > 0 || canCreate) && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="max-h-48 overflow-y-auto p-1">
            {/* Create new option */}
            {canCreate && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={createAndAdd}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Plus className="size-3.5 text-primary" />
                <span>
                  Create{" "}
                  <span className="font-medium text-primary">
                    &ldquo;{inputValue.trim()}&rdquo;
                  </span>
                </span>
              </button>
            )}

            {canCreate && filteredSuggestions.length > 0 && (
              <div className="mx-2 my-1 h-px bg-border" />
            )}

            {/* Existing suggestions */}
            {filteredSuggestions.map((cat) => {
              const isSelected = selected
                .map((s) => s.toLowerCase())
                .includes(cat.toLowerCase())

              return (
                <button
                  type="button"
                  key={cat}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => addCategory(cat)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <span>{cat}</span>
                  {isSelected && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
