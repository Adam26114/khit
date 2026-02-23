"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth";
import { useQuery, api } from "@/lib/convex";
import type { GenericId } from "convex/values";
import { ArrowRight, Package } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  // Get orders for the logged-in user
  // Note: This assumes the Better Auth user ID matches Convex user ID
  // In production, you may need to map between them
  const orders = useQuery(
    api.orders.getByCustomer,
    session?.user?.id ? { customerId: session.user.id as GenericId<"users"> } : "skip"
  );

  // Redirect if not logged in
  if (!isSessionPending && !session) {
    router.push("/login?callbackUrl=/account/orders");
    return null;
  }

  if (isSessionPending || orders === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 w-1/4" />
            <div className="h-32 bg-gray-200" />
            <div className="h-32 bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/account" className="hover:text-gray-900">
            My Account
          </Link>
          <ArrowRight size={12} />
          <span className="text-gray-900">Orders</span>
        </nav>

        <h1 className="text-2xl font-medium mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded">
            <div className="mx-auto mb-4 text-gray-400">
              <Package size={48} />
            </div>
            <h2 className="text-lg font-medium mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border rounded p-6 hover:border-black transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Number</p>
                    <p className="font-mono font-medium">{order.orderNumber}</p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Badge className={statusColors[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Items</p>
                    <p>{order.items.length} items</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Delivery</p>
                    <p className="capitalize">{order.deliveryMethod}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-medium">{order.total.toLocaleString()} MMK</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, index) => (
                      <p key={index} className="text-sm">
                        {item.quantity}x {item.name} ({item.size}, {item.color})
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-600">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/order-confirmation/${order.orderNumber}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
