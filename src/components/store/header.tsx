"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/providers/cart-provider";
import { useSession } from "@/lib/auth";

const categories = [
  { name: "WOMEN", href: "/women" },
  { name: "MEN", href: "/men" },
  { name: "NEW", href: "/new" },
  { name: "SALE", href: "/sale" },
];

export function StoreHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* Top Bar */}
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <span className="text-xl font-bold tracking-tight">KHIT</span>
                  </div>
                  <nav className="flex flex-col p-6 gap-6">
                    {categories.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="text-base font-medium hover:text-gray-600 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Nav - Left */}
            <nav className="hidden lg:flex items-center gap-8">
              {categories.slice(0, 2).map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="text-sm font-medium tracking-wide hover:text-gray-600 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* Logo - Centered */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              KHIT
            </Link>



            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search size={24} />
              </Button>
              <Link href={session ? "/account" : "/login"}>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <User size={24} />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 relative"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black text-white text-xs flex items-center justify-center">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Nav - Desktop */}
      <div className="hidden lg:block border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center gap-12 py-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`text-xs font-medium tracking-[0.2em] transition-colors ${
                  cat.name === "SALE"
                    ? "text-red-600 hover:text-red-700"
                    : "text-gray-900 hover:text-gray-600"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute inset-x-0 top-0 bg-white border-b z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="text-gray-400">
                <Search
                  size={24}
                />
              </div>
              <input
                type="text"
                placeholder="Search for products..."
                className="flex-1 bg-transparent outline-none text-lg"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(false)}
              >
                <X size={24} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
