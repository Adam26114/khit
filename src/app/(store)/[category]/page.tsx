"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Faders,
  ArrowRight,
} from "@/components/solar-icons";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery, api } from "@/lib/convex";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Blue", hex: "#4169e1" },
  { name: "Beige", hex: "#d4c5b0" },
  { name: "Pink", hex: "#ffc0cb" },
  { name: "Light Blue", hex: "#add8e6" },
  { name: "Mint", hex: "#98ff98" },
  { name: "Lavender", hex: "#e6e6fa" },
];

interface PageProps {
  params: { category: string };
}

export default function CategoryPage({ params }: PageProps) {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "sale">("newest");
  
  const categorySlug = params.category;
  const categoryName = categorySlug.toUpperCase();

  // Fetch filtered products from Convex
  const products = useQuery(
    api.products.filterProducts,
    categorySlug
      ? {
          categorySlug,
          sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
          colors: selectedColors.length > 0 ? selectedColors : undefined,
          sortBy,
        }
      : "skip"
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Size Filter */}
      <div>
        <h4 className="font-medium mb-3">Size</h4>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`w-10 h-10 border text-sm font-medium transition-colors ${
                selectedSizes.includes(size)
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div>
        <h4 className="font-medium mb-3">Color</h4>
        <div className="flex flex-wrap gap-3">
          {colorOptions.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`w-8 h-8 rounded-full border-2 ${
                selectedColors.includes(color.name)
                  ? "border-black"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="font-medium mb-3">Price</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300" />
            Under 30,000 MMK
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300" />
            30,000 - 50,000 MMK
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300" />
            Over 50,000 MMK
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ArrowRight size={12} />
        <span className="text-gray-900">{categoryName}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium mb-2">{categoryName}</h1>
        <p className="text-gray-600">
          {products === undefined ? "Loading..." : `${products.length} products`}
        </p>
      </div>

      {/* Filters & Sort Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Faders size={16} weight="duotone" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Toggle */}
          <Button
            variant="outline"
            className="hidden lg:flex"
            // onClick={() => setShowFilters(!showFilters)}
          >
            <Faders size={16} weight="duotone" />
            Filters
          </Button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "price-low" | "price-high" | "sale")}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="sale">Sale Items</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterContent />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products === undefined ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                  <div className="h-4 bg-gray-200 animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 mb-4">No products found</p>
              <Button variant="outline" asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Load More */}
              <div className="mt-12 text-center">
                <Button variant="outline" size="lg">
                  Load More
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
