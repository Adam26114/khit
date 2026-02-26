"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Search, X, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { FormattedPrice } from "@/components/ui/formatted-price";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounced search term
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const results = useQuery(
    api.products.searchProducts, 
    debouncedTerm.length >= 2 ? { query: debouncedTerm } : "skip"
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
      setSearchTerm("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white pt-2 overflow-y-auto">
      <div className="sticky top-0 bg-white z-10 border-b pb-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-4">
            <Search className="size-6 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="SEARCH FOR PRODUCTS..."
              className="flex-1 bg-transparent outline-none text-xl sm:text-2xl font-light tracking-wider uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onClose()}
            />
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-transparent">
              <X className="size-6" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {searchTerm.length < 2 ? (
          <div className="text-center py-20">
            <p className="text-sm tracking-widest text-gray-400 uppercase">Type at least 2 characters to search</p>
          </div>
        ) : results === undefined ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-gray-200" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <Package className="size-12 text-gray-100" />
            <p className="text-sm tracking-widest text-gray-400 uppercase">No products found for "{debouncedTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10">
            {results.map((product) => {
              const mainImage = product.variants?.[0]?.media?.[0]?.fileUrl || "/placeholder-product.jpg";
              const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
              
              return (
                <Link 
                  key={product._id} 
                  href={`/products/${product.slug}`} 
                  onClick={onClose}
                  className="group block"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 mb-3">
                    <Image
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[13px] font-normal text-black line-clamp-1 leading-snug uppercase tracking-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                       {hasDiscount ? (
                        <>
                          <span className="text-[12px] font-medium text-red-600">
                            <FormattedPrice price={product.salePrice!} />
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            <FormattedPrice price={product.basePrice} />
                          </span>
                        </>
                      ) : (
                        <span className="text-[12px] font-normal text-black">
                          <FormattedPrice price={product.basePrice} />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
