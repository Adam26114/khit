"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { useQuery, api } from "@/lib/convex";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { name: "WOMEN", href: "/women", image: "/category-women.jpg" },
  { name: "MEN", href: "/men", image: "/category-men.jpg" },
  { name: "NEW ARRIVALS", href: "/new", image: "/category-new.jpg" },
  { name: "SALE", href: "/sale", image: "/category-sale.jpg" },
];

export default function HomePage() {
  const featuredProducts = useQuery(api.products.getFeatured);
  return (
    <div>
      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[500px] bg-gray-100">
        <div className="absolute inset-0">
          <Image
            src="/hero-banner.jpg"
            alt="Khit Collection"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative h-full container mx-auto px-4 flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            NEW COLLECTION
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-8">
            Discover premium shirts crafted with quality fabrics for the modern
            Myanmar professional
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/new"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors gap-2"
            >
              Shop New Arrivals
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/men"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-medium hover:bg-white hover:text-black transition-colors"
            >
              Shop Men
            </Link>
          </div>
        </div>
      </section>

      {/* Category Links */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative aspect-[3/4] overflow-hidden bg-gray-100"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-lg font-medium tracking-wider text-white ${
                    cat.name === "SALE" ? "text-red-400" : ""
                  }`}
                >
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium">Featured Products</h2>
            <Link
              href="/new"
              className="text-sm font-medium hover:text-gray-600 flex items-center gap-1"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts === undefined ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full rounded-none bg-gray-200/80" />
                    <Skeleton className="h-4 w-3/4 rounded-none bg-gray-200/80" />
                    <Skeleton className="h-4 w-1/2 rounded-none bg-gray-200/80" />
                  </div>
                ))}
              </>
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full border border-dashed border-gray-300 bg-white p-10 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Package size={20} />
                </div>
                <p className="text-base font-medium text-gray-900">
                  No featured products yet
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Add products and mark them as featured from admin panel.
                </p>
                <Link
                  href="/admin/products"
                  className="mt-5 inline-flex items-center gap-2 border border-black px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
                >
                  Go to Admin Products
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-medium mb-4">
            Join the KHIT Community
          </h2>
          <p className="text-gray-600 mb-8">
            Subscribe to receive exclusive offers, early access to new
            collections, and styling tips
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">
            By subscribing, you agree to receive marketing emails. Unsubscribe
            at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
