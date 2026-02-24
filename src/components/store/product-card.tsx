"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildColorOptions,
  buildSizeOptionsForColor,
  getDisplayImagesForSelection,
  getSelectedVariant,
  getSizeStock,
  normalizeProductVariants,
  type ProductColorLike,
  type ProductVariantLike,
} from "@/lib/product-variants";

interface Product {
  _id: string;
  name: string;
  slug: string;
  categoryName?: string;
  price: number;
  salePrice?: number;
  images: string[];
  sizes: string[];
  colors: ProductColorLike[];
  isOutOfStock: boolean;
  variants?: ProductVariantLike[];
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const variants = useMemo(
    () => normalizeProductVariants(product.variants),
    [product.variants]
  );
  const colorOptions = useMemo(
    () => buildColorOptions(variants, product.colors),
    [variants, product.colors]
  );

  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState(
    colorOptions[0]?.id ?? ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!colorOptions.length) {
      setSelectedColorId("");
      return;
    }

    const hasSelected = colorOptions.some((color) => color.id === selectedColorId);
    if (!selectedColorId || !hasSelected) {
      setSelectedColorId(colorOptions[0].id);
    }
  }, [colorOptions, selectedColorId]);

  const sizeOptions = useMemo(
    () => buildSizeOptionsForColor(variants, selectedColorId, product.sizes),
    [variants, selectedColorId, product.sizes]
  );

  useEffect(() => {
    if (!sizeOptions.length) {
      setSelectedSize("");
      return;
    }

    if (!selectedSize || !sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [sizeOptions, selectedSize]);

  const selectedVariant = useMemo(
    () => getSelectedVariant(variants, selectedColorId),
    [variants, selectedColorId]
  );

  const resolvedImages = useMemo(
    () =>
      getDisplayImagesForSelection({
        variants,
        selectedColorId,
        selectedSize,
        productImages: product.images,
      }),
    [variants, selectedColorId, selectedSize, product.images]
  );

  useEffect(() => {
    if (currentImageIndex >= resolvedImages.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, resolvedImages.length]);

  const currentImage = resolvedImages[currentImageIndex] || "";
  const hasMultipleImages = resolvedImages.length > 1;
  const selectedColor = colorOptions.find((color) => color.id === selectedColorId);
  const categoryLabel = (product.categoryName || "ESSENTIALS").toUpperCase();

  const effectivePrice =
    (selectedVariant?.price ?? product.salePrice) || product.price;
  const hasDiscount = effectivePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - effectivePrice) / product.price) * 100
      )
    : 0;

  const visibleSizes = sizeOptions.slice(0, 6);
  const visibleColors = colorOptions.slice(0, 5);
  const isCurrentSelectionOutOfStock =
    variants.length > 0 ? (selectedVariant?.totalStock ?? 0) <= 0 : product.isOutOfStock;

  const goToNextImage = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev + 1) % resolvedImages.length);
  };

  const goToPreviousImage = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? resolvedImages.length - 1 : prev - 1
    );
  };

  const handleColorClick = (
    e: MouseEvent<HTMLButtonElement>,
    colorId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorId(colorId);
    setCurrentImageIndex(0);
  };

  return (
    <div>
      {/* Image Container */}
      <div
        className="group relative mb-1.5 aspect-[3/4] overflow-hidden bg-gray-100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/products/${product.slug}`}>
          {currentImage ? (
            <img
              src={currentImage}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </Link>

        {/* Carousel Controls */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goToPreviousImage}
              className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-md text-black transition-all hover:scale-110 p-0 ${
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={goToNextImage}
              className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-md text-black transition-all hover:scale-110 p-0 ${
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-label="Next image"
            >
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Hover Size Selector */}
        {!isCurrentSelectionOutOfStock && visibleSizes.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 bg-white/95 px-2 py-3 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {visibleSizes.map((size) => {
                const sizeStock = getSizeStock(selectedVariant, size);
                const isSizeOutOfStock = variants.length > 0 ? sizeStock <= 0 : false;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isSizeOutOfStock}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    className={`text-[12px] font-medium px-2 py-1 transition-colors ${
                      isSizeOutOfStock
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-black hover:bg-gray-100"
                    } ${selectedSize === size ? "bg-gray-100" : ""}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isCurrentSelectionOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-sm font-medium tracking-wide text-gray-900">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && !isCurrentSelectionOutOfStock && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-medium px-2 py-1">
            -{discountPercentage}%
          </div>
        )}
      </div>

      <div className="space-y-1 pt-2">
        <p className="text-[10px] text-gray-400 font-normal">
          {categoryLabel}
        </p>

        <div className="flex items-center justify-between gap-4">
          <Link href={`/products/${product.slug}`} className="flex-1">
            <h3 className="text-[13px] font-normal text-black line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-none p-0 text-gray-400 hover:bg-transparent hover:text-black"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted((prev) => !prev);
            }}
          >
            <Heart
              fill={isWishlisted ? "black" : "none"}
              className={`size-5 transition-all ${
                isWishlisted ? "text-black" : "text-gray-400"
              }`}
            />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-[13px] font-medium text-red-600">
                {effectivePrice.toLocaleString()} MMK
              </span>
              <span className="text-[11px] text-gray-400 line-through">
                {product.price.toLocaleString()} MMK
              </span>
            </>
          ) : (
            <span className="text-[13px] font-normal text-black">
              {product.price.toLocaleString()} MMK
            </span>
          )}
        </div>

        {/* Color Swatches — MANGO-style: small squares */}
        <div className="flex items-center gap-1.5 pt-1">
          {visibleColors.map((color) => {
            const isSelected = selectedColorId === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={(e) => handleColorClick(e, color.id)}
                className="group flex flex-col items-center relative pb-1"
                title={color.name}
              >
                <span
                  className={`h-3.5 w-3.5 ${
                    isSelected
                      ? "border border-black"
                      : "border border-[#E5E5E5]"
                  }`}
                  style={{
                    backgroundColor: color.hex,
                  }}
                />
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black" />
                )}
              </button>
            );
          })}
          {colorOptions.length > visibleColors.length && (
            <span className="text-[10px] text-gray-500">
              +{colorOptions.length - visibleColors.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
