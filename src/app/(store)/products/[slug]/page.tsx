"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  Store,
  Truck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/store/product-card";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { useCart } from "@/providers/cart-provider";
import { useQuery, api } from "@/lib/convex";
import { resolveImageSrc } from "@/lib/image";
import {
  buildColorOptions,
  buildSizeOptionsForColor,
  getDisplayImagesForSelection,
  getSelectedVariant,
  getSizeStock,
  normalizeProductVariants,
} from "@/lib/product-variants";

interface PageProps {
  params: { slug: string };
}

export default function ProductPage({ params }: PageProps) {
  const { slug } = params;

  // Fetch product from Convex
  const product = useQuery(
    api.products.getBySlug,
    slug ? { slug } : "skip"
  );

  // Fetch featured products for "You May Also Like" section
  const relatedProducts = useQuery(api.products.getFeatured);

  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const { addItem } = useCart();

  const variants = useMemo(
    () => normalizeProductVariants(product?.variants),
    [product?.variants]
  );
  const colorOptions = useMemo(
    () => buildColorOptions(variants, product?.colors ?? []),
    [variants, product?.colors]
  );
  const sizeOptions = useMemo(
    () => buildSizeOptionsForColor(variants, selectedColorId, product?.sizes ?? []),
    [variants, selectedColorId, product?.sizes]
  );
  const selectedVariant = useMemo(
    () => getSelectedVariant(variants, selectedColorId),
    [variants, selectedColorId]
  );
  const displayImages = useMemo(
    () =>
      getDisplayImagesForSelection({
        variants,
        selectedColorId,
        selectedSize,
        productImages: product?.images ?? [],
      }),
    [variants, selectedColorId, selectedSize, product?.images]
  );
  const selectedColor = colorOptions.find((color) => color.id === selectedColorId);
  const currentImageSrc = displayImages[selectedImage] || displayImages[0] || "";

  // Per-size stock for the selected color variant.
  const selectedSizeStock = getSizeStock(selectedVariant, selectedSize);
  const effectivePrice =
    selectedVariant?.price ?? product?.salePrice ?? product?.price ?? 0;
  const isSelectionOutOfStock =
    variants.length > 0
      ? selectedSizeStock <= 0
      : Boolean(product?.isOutOfStock);

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

  useEffect(() => {
    if (!sizeOptions.length) {
      setSelectedSize("");
      return;
    }

    if (!selectedSize || !sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [sizeOptions, selectedSize]);

  useEffect(() => {
    if (selectedImage >= displayImages.length) {
      setSelectedImage(0);
    }
  }, [selectedImage, displayImages.length]);

  useEffect(() => {
    setIsImageLoading(Boolean(currentImageSrc));
  }, [currentImageSrc]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    if (!selectedColor) {
      alert("Please select a color");
      return;
    }
    if (isSelectionOutOfStock) {
      alert("Selected variant is out of stock");
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: effectivePrice,
      salePrice: undefined,
      size: selectedSize,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      quantity: 1,
      image:
        displayImages[selectedImage] ||
        displayImages[0] ||
        resolveImageSrc(product.images?.[0]),
    });
  };

  if (product === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Loading Image Skeleton */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Loading Info Skeleton */}
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 animate-pulse w-3/4" />
            <div className="h-6 bg-gray-200 animate-pulse w-1/4" />
            <div className="h-12 bg-gray-200 animate-pulse w-full" />
            <div className="h-12 bg-gray-200 animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-medium mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  // Calculate discount info (product is guaranteed to exist here)
  const hasDiscount = effectivePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - effectivePrice) / product.price) * 100
      )
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs 
        items={[
          { label: "Products", href: "/new" },
          { label: product.name }
        ]} 
        className="mb-8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
            {displayImages.length > 0 ? (
              <>
                {isImageLoading && (
                  <div className="absolute inset-0 animate-pulse bg-gray-200" />
                )}
                <img
                  key={currentImageSrc}
                  src={currentImageSrc}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">
                No image
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-medium px-3 py-1">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Thumbnail Grid */}
          {displayImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {displayImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => {
                    setSelectedImage(index);
                  }}
                  className={`relative aspect-square bg-gray-100 overflow-hidden border-2 ${
                    selectedImage === index ? "border-black" : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Title & Price */}
          <h1 className="text-2xl lg:text-3xl font-medium mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-semibold text-red-600 tracking-tight">
                  <FormattedPrice price={effectivePrice} />
                </span>
                <span className="text-lg text-gray-300 line-through decoration-gray-200">
                  <FormattedPrice price={product.price} />
                </span>
              </>
            ) : (
              <span className="text-2xl font-semibold tracking-tight">
                <FormattedPrice price={product.price} />
              </span>
            )}
          </div>

          {/* Color Selector — MANGO-style squares */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Color</span>
              <span className="text-sm text-gray-600">
                {selectedColor?.name || "Select a color"}
              </span>
            </div>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedColorId(color.id);
                    setSelectedImage(0);
                  }}
                  className={`w-8 h-8 border-2 ${
                    selectedColorId === color.id
                      ? "border-black"
                      : "border-[#E5E5E5]"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selector — filtered by selected color */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Size</span>
              <button className="text-sm text-gray-600 underline">
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const sizeStock = getSizeStock(selectedVariant, size);
                const isSizeOutOfStock = variants.length > 0 ? sizeStock <= 0 : false;

                return (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                    }}
                    disabled={isSizeOutOfStock}
                    className={`w-12 h-12 border text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-gray-400"
                    } ${isSizeOutOfStock ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Indicator */}
          {selectedSizeStock < 5 && selectedSizeStock > 0 && (
            <p className="text-sm text-orange-600 mb-4">
              Only {selectedSizeStock} left in stock
            </p>
          )}

          {/* Add to Cart */}
          <div className="space-y-3 mb-8">
            <Button
              size="lg"
              className="w-full h-12 text-sm uppercase tracking-widest font-bold"
              disabled={isSelectionOutOfStock}
              onClick={handleAddToCart}
            >
              {isSelectionOutOfStock ? "SOLD OUT" : "ADD TO BAG"}
            </Button>

            <Button variant="outline" size="lg" className="w-full h-12 text-sm uppercase tracking-widest font-bold border-gray-200">
              <Heart className="size-4 mr-2" />
              ADD TO WISHLIST
            </Button>
          </div>

          {/* Delivery Info */}
          <div className="space-y-4 text-xs mb-8 border-t pt-8">
            <div className="flex items-center gap-4 text-gray-500 uppercase tracking-widest font-medium">
              <Truck className="size-5 text-gray-400" />
              <span>Standard Delivery (3-5 Days)</span>
            </div>
            <div className="flex items-center gap-4 text-gray-500 uppercase tracking-widest font-medium">
              <Store className="size-5 text-gray-400" />
              <span>Free Pickup in Store</span>
            </div>
          </div>

          {/* Accordions */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="description">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent>{product.description}</AccordionContent>
            </AccordionItem>

            {product.careInstructions && (
              <AccordionItem value="care">
                <AccordionTrigger>Care Instructions</AccordionTrigger>
                <AccordionContent>{product.careInstructions}</AccordionContent>
              </AccordionItem>
            )}

            {product.sizeFit && (
              <AccordionItem value="size">
                <AccordionTrigger>Size & Fit</AccordionTrigger>
                <AccordionContent>{product.sizeFit}</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16 pt-16 border-t">
        <h2 className="text-2xl font-medium mb-8">You May Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts === undefined ? (
            // Loading skeleton
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                  <div className="h-4 bg-gray-200 animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 animate-pulse w-1/2" />
                </div>
              ))}
            </>
          ) : (
            relatedProducts
              .filter((p) => p._id !== product._id)
              .slice(0, 4)
              .map((p) => <ProductCard key={p._id} product={p} />)
          )}
        </div>
      </section>
    </div>
  );
}
