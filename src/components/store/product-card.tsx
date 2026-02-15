"use client";

import Link from "next/link";
import { type MouseEvent, useState } from "react";
import { CaretRight, Heart } from "@/components/solar-icons";
import { Button } from "@/components/ui/button";
import { resolveImageSrc } from "@/lib/image";

interface ProductColor {
  name: string;
  hex: string;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  isOutOfStock: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const resolvedImages = product.images
    .map((image) => resolveImageSrc(image))
    .filter((image): image is string => Boolean(image));
  const currentImage = resolvedImages[currentImageIndex] || "";
  const hasMultipleImages = resolvedImages.length > 1;

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - (product.salePrice || 0)) / product.price) * 100
      )
    : 0;
  const visibleSizes = product.sizes.slice(0, 6);
  const visibleColors = product.colors.slice(0, 5);

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
    colorName: string,
    colorIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(colorName);

    if (resolvedImages.length > 0) {
      const imageIndex = Math.min(colorIndex, resolvedImages.length - 1);
      setCurrentImageIndex(imageIndex);
    }
  };

  return (
    <div
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-4">
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
        {!product.isOutOfStock && visibleSizes.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 bg-white/90 px-2 py-2 transition ${
              isHovered ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex flex-wrap gap-1">
              {visibleSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`min-w-8 border px-2 py-1 text-[11px] font-medium transition-colors ${
                    selectedSize === size
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-black hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-sm font-medium tracking-wide text-gray-900">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && !product.isOutOfStock && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-medium px-2 py-1">
            -{discountPercentage}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-sm font-medium text-red-600">
                {product.salePrice?.toLocaleString()} MMK
              </span>
              <span className="text-sm text-gray-400 line-through">
                {product.price.toLocaleString()} MMK
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-900">
              {product.price.toLocaleString()} MMK
            </span>
          )}
        </div>

        {/* Colors + Wishlist */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {visibleColors.map((color, index) => (
              <button
                key={color.name}
                type="button"
                onClick={(e) => handleColorClick(e, color.name, index)}
                className={`h-5 w-5 border transition ${
                  selectedColor === color.name
                    ? "border-black ring-1 ring-black"
                    : "border-gray-300 hover:border-black"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > visibleColors.length && (
              <span className="text-xs text-gray-600">
                +{product.colors.length - visibleColors.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-transparent"
            aria-label="Add to wishlist"
          >
            <Heart size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
