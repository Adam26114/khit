"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/providers/cart-provider";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { resolveImageSrc } from "@/lib/image";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    isOpen,
    setIsOpen,
  } = useCart();

  const shippingFee = 2500;
  const total = subtotal + shippingFee;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-lg font-medium flex items-center gap-2">
            <ShoppingBag size={20} />
            Your Bag ({items.length} items)
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
            <div className="text-gray-300">
              <ShoppingBag size={64} />
            </div>
            <p className="text-gray-500">Your bag is empty</p>
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-4 pb-4 border-b last:border-0"
                >
                  {/* Product Image */}
                  <div className="relative h-24 w-20 bg-gray-100 flex-shrink-0">
                    {item.image ? (
                      <img
                        src={resolveImageSrc(item.image)}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium hover:text-gray-600 transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.size} | Color: {item.color}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {(item.salePrice || item.price).toLocaleString()} MMK
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-gray-400 hover:text-red-600"
                        onClick={() =>
                          removeItem(item.productId, item.size, item.color)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shippingFee.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between font-medium text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{total.toLocaleString()} MMK</span>
                </div>
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                  Checkout
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
