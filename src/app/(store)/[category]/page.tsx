"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ListFilter,
  ArrowRight,
} from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery, api } from "@/lib/convex";

interface PageProps {
  params: { category: string };
}

export default function CategoryPage({ params }: PageProps) {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "sale">("newest");
  
  const categorySlug = params.category;
  const categoryName = categorySlug.toUpperCase();

  const filterData = useQuery(api.products.getCategoryFilters, { categorySlug });
  const sizes = filterData?.sizes ?? [];
  const colors = filterData?.colors ?? [];

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

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Size Filter */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4">Size</h4>
        <div className="flex flex-wrap gap-2">
          {sizes.map((sizeName: string) => (
            <button
              key={sizeName}
              onClick={() => toggleSize(sizeName)}
              className={`min-w-[40px] h-10 border text-[11px] font-bold transition-all uppercase tracking-tighter ${
                selectedSizes.includes(sizeName)
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-gray-400 text-gray-500"
              }`}
            >
              {sizeName}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4">Color</h4>
        <div className="flex flex-wrap gap-3">
          {colors.map((color: { name: string; hex: string }) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`w-6 h-6 rounded-full border transition-all ${
                selectedColors.includes(color.name)
                  ? "border-black scale-110 shadow-sm"
                  : "border-gray-100"
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
      <Breadcrumbs 
        items={[{ label: categoryName }]} 
        className="mb-8"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium mb-2 tracking-tight uppercase">{categoryName}</h1>
        <p className="text-[11px] text-gray-500 uppercase tracking-widest">
          {products === undefined ? "LOADING..." : `${products.length} PRODUCTS`}
        </p>
      </div>

      {/* Filters & Sort Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden h-10 rounded-none border-gray-200">
                <ListFilter size={16} />
                <span className="text-xs uppercase tracking-widest font-medium ml-2">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="uppercase tracking-widest text-sm font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Toggle */}
          <Button
            variant="outline"
            className="hidden lg:flex h-10 rounded-none border-gray-200"
          >
            <ListFilter size={16} />
            <span className="text-xs uppercase tracking-widest font-medium ml-2">Filters</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold hidden sm:inline">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "price-low" | "price-high" | "sale")}
            className="border-none bg-transparent hover:text-gray-500 transition-colors text-xs font-semibold uppercase tracking-widest focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low-High</option>
            <option value="price-high">Price: High-Low</option>
            <option value="sale">Sale</option>
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
