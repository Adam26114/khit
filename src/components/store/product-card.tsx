"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { CaretRight, Heart } from "@/components/solar-icons";
import { Button } from "@/components/ui/button";
import {
  buildColorOptions,
  buildSizeOptionsForColor,
  getDisplayImagesForSelection,
  getSelectedVariant,
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
    () => getSelectedVariant(variants, selectedColorId, selectedSize),
    [variants, selectedColorId, selectedSize]
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
    selectedVariant?.price ?? product.salePrice ?? product.price;
  const hasDiscount = effectivePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - effectivePrice) / product.price) * 100
      )
    : 0;

  const visibleSizes = sizeOptions.slice(0, 6);
  const visibleColors = colorOptions.slice(0, 5);
  const selectedStock = selectedVariant?.stock ?? selectedColor?.stock ?? 0;
  const isCurrentSelectionOutOfStock =
    variants.length > 0 ? selectedStock <= 0 : product.isOutOfStock;

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
        className="group relative mb-4 aspect-[3/4] overflow-hidden bg-gray-100"
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
              className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 items-center justify-center border border-black/20 bg-white/85 text-black transition ${
                isHovered ? "flex opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-label="Previous image"
            >
              <CaretRight size={16} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={goToNextImage}
              className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 items-center justify-center border border-black/20 bg-white/85 text-black transition ${
                isHovered ? "flex opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-label="Next image"
            >
              <CaretRight size={16} />
            </button>
          </>
        )}

        {/* Hover Size Selector */}
        {!isCurrentSelectionOutOfStock && visibleSizes.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 bg-gray-100/85 px-3 py-3 backdrop-blur-[1px] transition ${
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              {visibleSizes.map((size) => {
                const variantForSize = getSelectedVariant(variants, selectedColorId, size);
                const isSizeOutOfStock =
                  variants.length > 0 ? (variantForSize?.stock ?? 0) <= 0 : false;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isSizeOutOfStock}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(size);
                      setCurrentImageIndex(0);
                    }}
                    className={`min-w-10 border border-transparent px-3 py-2 text-[13px] font-medium leading-none text-gray-700 transition-colors ${
                      selectedSize === size
                        ? "bg-[#e5e5e5] text-gray-900"
                        : "bg-transparent hover:bg-gray-200/80"
                    } ${isSizeOutOfStock ? "cursor-not-allowed opacity-40" : ""}`}
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

      {/* Product Info */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <p className="pt-0.5 text-[10px] uppercase tracking-wide text-gray-600">
            {categoryLabel}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-none p-0 text-gray-700 hover:bg-transparent hover:text-black"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted((prev) => !prev);
            }}
          >
            <Heart
              weight={isWishlisted ? "fill" : "duotone"}
              className={`h-5 w-5 transition-all ${
                isWishlisted ? "text-gray-900" : "text-gray-700"
              }`}
            />
          </Button>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-[14px] font-medium leading-6 text-gray-900 transition-colors hover:text-gray-600">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-[14px] text-gray-400 line-through">
                {product.price.toLocaleString()} MMK
              </span>
              <span className="text-[14px] font-semibold text-red-600">
                {effectivePrice.toLocaleString()} MMK
              </span>
            </>
          ) : (
            <span className="text-[14px] font-medium text-gray-900">
              {product.price.toLocaleString()} MMK
            </span>
          )}
        </div>

        {/* Colors */}
        <div className="flex items-end gap-2">
          {visibleColors.map((color) => {
            const isSelected = selectedColorId === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={(e) => handleColorClick(e, color.id)}
                className="flex flex-col items-center gap-1"
                title={color.name}
              >
                <span
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: color.hex }}
                />
                <span
                  className="h-0.5 w-5 transition-colors"
                  style={{ backgroundColor: isSelected ? color.hex : "transparent" }}
                />
              </button>
            );
          })}
          {colorOptions.length > visibleColors.length && (
            <span className="pb-1 text-xs text-gray-600">
              +{colorOptions.length - visibleColors.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
