import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { nanoid } from "nanoid";
import type { Doc, Id } from "./_generated/dataModel";

// Generate unique order number.
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = nanoid(6).toUpperCase();
  return `ORD-${year}-${random}`;
}

async function findVariantBySelection(
  ctx: MutationCtx,
  selection: { productId: Id<"products">; color: string; size: string }
): Promise<Doc<"productVariants"> | null> {
  const variants = await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", selection.productId))
    .collect();

  const activeVariants = variants.filter((variant) => variant.isActive);

  for (const variant of activeVariants) {
    const [color, size] = await Promise.all([
      ctx.db.get(variant.colorId),
      ctx.db.get(variant.sizeId),
    ]);

    if (
      color?.name.toLowerCase() === selection.color.toLowerCase() &&
      size?.name.toLowerCase() === selection.size.toLowerCase()
    ) {
      return variant;
    }
  }

  return activeVariants.find((variant) => variant.isPrimary) || activeVariants[0] || null;
}

// Create new order.
export const create = mutation({
  args: {
    customerId: v.optional(v.id("users")),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        size: v.string(),
        color: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    subtotal: v.number(),
    shippingFee: v.number(),
    total: v.number(),
    deliveryMethod: v.union(v.literal("shipping"), v.literal("pickup")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderNumber = generateOrderNumber();

    const itemsWithVariants: Array<{
      productId: Id<"products">;
      variantId?: Id<"productVariants">;
      name: string;
      size: string;
      color: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of args.items) {
      const variant = await findVariantBySelection(ctx, {
        productId: item.productId,
        color: item.color,
        size: item.size,
      });

      if (variant) {
        if (variant.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock for ${item.name} (${item.color}/${item.size})`);
        }

        await ctx.db.patch(variant._id, {
          stockQuantity: variant.stockQuantity - item.quantity,
          updatedAt: now,
        });
      }

      itemsWithVariants.push({
        ...item,
        variantId: variant?._id,
      });
    }

    const orderId = await ctx.db.insert("orders", {
      ...args,
      items: itemsWithVariants,
      orderNumber,
      paymentMethod: "cod",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, orderNumber };
  },
});

// Update order status.
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { id, status }) => {
    const order = await ctx.db.get(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // If cancelling, restore variant stock.
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        let variant = item.variantId ? await ctx.db.get(item.variantId) : null;

        if (!variant) {
          variant = await findVariantBySelection(ctx, {
            productId: item.productId,
            color: item.color,
            size: item.size,
          });
        }

        if (!variant) {
          continue;
        }

        await ctx.db.patch(variant._id, {
          stockQuantity: variant.stockQuantity + item.quantity,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(id, {
      status,
      updatedAt: Date.now(),
    });
  },
});

// Get order by number.
export const getByNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, { orderNumber }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
      .unique();

    return order;
  },
});

// Get orders by customer.
export const getByCustomer = query({
  args: { customerId: v.id("users") },
  handler: async (ctx, { customerId }) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .order("desc")
      .collect();

    return orders;
  },
});

// Get all orders (admin).
export const getAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_createdAt")
        .order("desc")
        .collect();
    }

    if (args.limit) {
      orders = orders.slice(0, args.limit);
    }

    return orders;
  },
});

// Get today's orders with stats.
export const getTodayStats = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), startTimestamp))
      .collect();

    const pending = orders.filter((order) => order.status === "pending").length;
    const todayRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      total: orders.length,
      pending,
      revenue: todayRevenue,
    };
  },
});
