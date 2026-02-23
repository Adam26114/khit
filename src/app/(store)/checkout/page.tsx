"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Store,
  Truck,
  Banknote,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/providers/cart-provider";
import { useMutation, api } from "@/lib/convex";
import { useSession } from "@/lib/auth";
import { resolveImageSrc } from "@/lib/image";
import type { GenericId } from "convex/values";

const SHIPPING_FEE = 2500;

// Store pickup location
const PICKUP_LOCATION = {
  name: "KHIT Flagship Store",
  address: "123 Main Street, Yangon, Myanmar",
  hours: "Mon-Sat: 9am - 6pm, Sun: 10am - 4pm",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrder = useMutation(api.orders.create);
  const { data: session } = useSession();

  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">(
    "shipping"
  );
  const [customerInfo, setCustomerInfo] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
  });
  const [notes, setNotes] = useState("");

  const shippingFee = deliveryMethod === "shipping" ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (deliveryMethod === "shipping" && !customerInfo.address) {
      alert("Please enter your delivery address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order in Convex
      const result = await createOrder({
        customerId: session?.user?.id as GenericId<"users"> | undefined,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: deliveryMethod === "shipping" ? customerInfo.address : undefined,
        },
        items: items.map(item => ({
          productId: item.productId as GenericId<"products">,
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.salePrice || item.price,
        })),
        subtotal,
        shippingFee,
        total,
        deliveryMethod,
        notes: notes || undefined,
      });

      clearCart();
      router.push(`/order-confirmation/${result.orderNumber}`);
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-medium mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">
          Add some items to your cart to proceed with checkout
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ArrowRight size={12} />
        <span className="text-gray-900">Checkout</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Checkout Form */}
        <div>
          <h1 className="text-2xl font-medium mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Delivery Method */}
            <div>
              <h2 className="text-lg font-medium mb-4">Delivery Method</h2>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(value) =>
                  setDeliveryMethod(value as "shipping" | "pickup")
                }
                className="space-y-3"
              >
                <div
                  className={`border rounded p-4 cursor-pointer ${
                    deliveryMethod === "shipping"
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="shipping" id="shipping" />
                    <div className="flex-1">
                      <Label
                        htmlFor="shipping"
                        className="flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Truck size={20} />
                        Delivery to Your Address
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {SHIPPING_FEE.toLocaleString()} MMK • 1-3 business days
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded p-4 cursor-pointer ${
                    deliveryMethod === "pickup"
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <div className="flex-1">
                      <Label
                        htmlFor="pickup"
                        className="flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Store size={20} />
                        Store Pickup
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        FREE • Ready within 24 hours
                      </p>
                      {deliveryMethod === "pickup" && (
                        <div className="mt-3 p-3 bg-gray-50 text-sm">
                          <p className="font-medium">{PICKUP_LOCATION.name}</p>
                          <p className="text-gray-600">
                            {PICKUP_LOCATION.address}
                          </p>
                          <p className="text-gray-600">
                            {PICKUP_LOCATION.hours}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-medium mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        })
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {deliveryMethod === "shipping" && (
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          address: e.target.value,
                        })
                      }
                      required={deliveryMethod === "shipping"}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <Label htmlFor="notes">
                Order Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions for delivery..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-lg font-medium mb-4">Payment Method</h2>
              <div className="border border-black rounded p-4">
                <div className="flex items-center gap-3">
                  <Banknote size={20} />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">
                      Pay when you receive your order
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Order Summary */}
            <div className="lg:hidden border-t pt-6">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <OrderSummary
                items={items}
                subtotal={subtotal}
                shippingFee={shippingFee}
                total={total}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  <Heart size={16} fill="currentColor" />
                  Place Order • {total.toLocaleString()} MMK
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Desktop Order Summary */}
        <div className="hidden lg:block">
          <div className="sticky top-24 bg-gray-50 p-6">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  shippingFee,
  total,
}: {
  items: {
    name: string;
    quantity: number;
    price: number;
    salePrice?: number;
    size: string;
    color: string;
    image: string;
  }[];
  subtotal: number;
  shippingFee: number;
  total: number;
}) {
  return (
    <>
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="relative h-16 w-16 bg-gray-200 flex-shrink-0">
              {item.image && (
                <img
                  src={resolveImageSrc(item.image)}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-gray-600">
                {item.size} / {item.color}
              </p>
              <p className="text-sm">
                {(item.salePrice || item.price).toLocaleString()} MMK
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 pt-4 border-t text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{subtotal.toLocaleString()} MMK</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span>
            {shippingFee === 0 ? "FREE" : `${shippingFee.toLocaleString()} MMK`}
          </span>
        </div>
        <div className="flex justify-between font-medium text-base pt-2 border-t">
          <span>Total</span>
          <span>{total.toLocaleString()} MMK</span>
        </div>
      </div>
    </>
  );
}
