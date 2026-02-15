"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Heart,
  Storefront,
  Truck,
} from "@/components/solar-icons";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/store/product-card";
import { useCart } from "@/providers/cart-provider";
import { useQuery, api } from "@/lib/convex";
import { resolveImageSrc } from "@/lib/image";

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
  
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  
  // Update selected color when product loads
  if (product && !selectedColor) {
    setSelectedColor(product.colors[0]);
  }

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

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      size: selectedSize,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      quantity: 1,
      image: resolveImageSrc(product.images[0]),
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
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - (product.salePrice || 0)) / product.price) * 100
      )
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ArrowRight size={12} />
        <Link href="/men" className="hover:text-gray-900">
          MEN
        </Link>
        <ArrowRight size={12} />
        <Link href="/men/shirts" className="hover:text-gray-900">
          Shirts
        </Link>
        <ArrowRight size={12} />
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
            <img
              src={resolveImageSrc(product.images[selectedImage])}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-medium px-3 py-1">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square bg-gray-100 overflow-hidden border-2 ${
                  selectedImage === index
                    ? "border-black"
                    : "border-transparent"
                }`}
              >
                <img
                  src={resolveImageSrc(image)}
                  alt={`${product.name} - ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
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
                <span className="text-2xl font-medium text-red-600">
                  {product.salePrice?.toLocaleString()} MMK
                </span>
                <span className="text-lg text-gray-400 line-through">
                  {product.price.toLocaleString()} MMK
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium">
                {product.price.toLocaleString()} MMK
              </span>
            )}
          </div>

          {/* Color Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Color</span>
              <span className="text-sm text-gray-600">
                {selectedColor?.name || "Select a color"}
              </span>
            </div>
            <div className="flex gap-3">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full border-2 ${
                    selectedColor?.name === color.name
                      ? "border-black"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Size</span>
              <button className="text-sm text-gray-600 underline">
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 border text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? "border-black bg-black text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Indicator */}
          {selectedColor && selectedColor.stock < 5 && selectedColor.stock > 0 && (
            <p className="text-sm text-orange-600 mb-4">
              Only {selectedColor.stock} left in stock
            </p>
          )}

          {/* Add to Cart */}
          <div className="space-y-3 mb-6">
            <Button
              size="lg"
              className="w-full"
              disabled={product.isOutOfStock}
              onClick={handleAddToCart}
            >
              {product.isOutOfStock ? "Out of Stock" : "Add to Bag"}
            </Button>

            <Button variant="outline" size="lg" className="w-full">
              <Heart size={16} weight="duotone" />
              Add to Wishlist
            </Button>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 text-sm mb-8">
            <div className="flex items-center gap-3 text-gray-600">
              <Truck size={20} weight="duotone" />
              <span>Free delivery to store</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Storefront size={20} weight="duotone" />
              <span>Check in-store availability</span>
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
