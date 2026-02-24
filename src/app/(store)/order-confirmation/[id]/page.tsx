"use client";

import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Package,
  Clock,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, api } from "@/lib/convex";

interface PageProps {
  params: { id: string };
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const orderNumber = params.id;
  
  // Fetch order from Convex
  const order = useQuery(
    api.orders.getByNumber,
    orderNumber ? { orderNumber } : "skip"
  );

  if (order === undefined) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto" />
            <div className="h-8 bg-gray-200 w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-medium mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find an order with number <strong>{orderNumber}</strong>.
          </p>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <CheckCircle size={48} className="text-green-600 mb-4" />
          </div>
          <h1 className="text-3xl font-medium mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. We&apos;ve sent a confirmation email to{" "}
            {order.customerInfo.email}.
          </p>
        </div>

        {/* Order Number */}
        <div className="bg-gray-50 rounded p-6 mb-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Order Number</p>
          <p className="text-2xl font-mono font-medium">{orderNumber}</p>
          <p className="text-sm text-gray-500 mt-2">
            Status: <span className="capitalize">{order.status}</span>
          </p>
        </div>

        {/* Customer Info */}
        <div className="text-left bg-white border rounded p-6 mb-8">
          <h2 className="font-medium mb-4">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-600">Name:</span> {order.customerInfo.name}</p>
            <p><span className="text-gray-600">Email:</span> {order.customerInfo.email}</p>
            <p><span className="text-gray-600">Phone:</span> {order.customerInfo.phone}</p>
            {order.deliveryMethod === "shipping" && order.customerInfo.address && (
              <p><span className="text-gray-600">Address:</span> {order.customerInfo.address}</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="text-left bg-white border rounded p-6 mb-8">
          <h2 className="font-medium mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">{(item.price * item.quantity).toLocaleString()} MMK</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{order.subtotal.toLocaleString()} MMK</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span>{order.shippingFee === 0 ? "FREE" : `${order.shippingFee.toLocaleString()} MMK`}</span>
            </div>
            <div className="flex justify-between font-medium text-lg pt-2 border-t">
              <span>Total</span>
              <span>{order.total.toLocaleString()} MMK</span>
            </div>
          </div>
        </div>

        {/* Delivery Method */}
        <div className="text-left bg-white border rounded p-6 mb-8">
          <h2 className="font-medium mb-4">Delivery Method</h2>
          <div className="flex items-center gap-3">
            {order.deliveryMethod === "pickup" ? (
              <>
                <Store size={16} />
                <div>
                  <p className="font-medium">Store Pickup</p>
                  <p className="text-sm text-gray-600">FREE • Ready within 24 hours</p>
                </div>
              </>
            ) : (
              <>
                <Truck size={16} />
                <div>
                  <p className="font-medium">Delivery to Your Address</p>
                  <p className="text-sm text-gray-600">{order.shippingFee.toLocaleString()} MMK • 1-3 business days</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="text-left bg-white border rounded p-6 mb-8">
          <h2 className="font-medium mb-4">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-sm text-gray-600">
                  We&apos;re preparing your order for {order.deliveryMethod === "pickup" ? "pickup" : "shipment"}. You&apos;ll receive
                  an update within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package size={16} />
              </div>
              <div>
                <h3 className="font-medium">{order.deliveryMethod === "pickup" ? "Ready for Pickup" : "Delivery"}</h3>
                <p className="text-sm text-gray-600">
                  {order.deliveryMethod === "pickup" 
                    ? "We'll notify you when your order is ready for pickup at our store."
                    : "Estimated delivery: 1-3 business days. We'll send you tracking information once your order ships."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 rounded p-4 mb-8 text-left">
          <p className="text-sm text-blue-800">
            <strong>Cash on Delivery:</strong> Please have the exact amount of{" "}
            <strong>{order.total.toLocaleString()} MMK</strong>{" "}
            ready when {order.deliveryMethod === "pickup" ? "picking up your order" : "your order arrives"}. Our {order.deliveryMethod === "pickup" ? "staff" : "delivery partner"} will collect
            payment upon {order.deliveryMethod === "pickup" ? "pickup" : "delivery"}.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/" className="inline-flex items-center justify-center">
              Continue Shopping
              <span className="ml-2">
                <ArrowRight size={16} />
              </span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/account/orders">View Order History</Link>
          </Button>
        </div>

        {/* Support */}
        <p className="mt-8 text-sm text-gray-600">
          Need help?{" "}
          <Link href="/contact" className="underline hover:text-gray-900">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
