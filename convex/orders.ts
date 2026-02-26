import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { nanoid } from "nanoid";
import type { Doc, Id } from "./_generated/dataModel";

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = nanoid(6).toUpperCase();
  return `ORD-${year}-${random}`;
}

async function findColorVariantBySelection(
  ctx: MutationCtx,
  selection: { productId: Id<"products">; color: string; size: string }
): Promise<{ product: Doc<"products">; colorVariantIndex: number } | null> {
  const product = await ctx.db.get(selection.productId);
  if (!product) {
    return null;
  }

  const colorVariants = product.colorVariants ?? [];

  for (let i = 0; i < colorVariants.length; i++) {
    const cv = colorVariants[i];
    if (cv.colorName.toLowerCase() === selection.color.toLowerCase()) {
      return { product, colorVariantIndex: i };
    }
  }

  if (colorVariants.length > 0) {
    return { product, colorVariantIndex: 0 };
  }

  return null;
}

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
        colorVariantId: v.optional(v.string()),
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
      colorVariantId?: string;
      name: string;
      size: string;
      color: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of args.items) {
      const result = await findColorVariantBySelection(ctx, {
        productId: item.productId,
        color: item.color,
        size: item.size,
      });

      if (result) {
        const { product, colorVariantIndex } = result;
        const colorVariants = [...(product.colorVariants ?? [])];
        const cv = colorVariants[colorVariantIndex];

        const currentStock = cv.stock?.[item.size] ?? 0;

        if (currentStock < item.quantity) {
          throw new Error(`Not enough stock for ${item.name} (${item.color}/${item.size})`);
        }

        colorVariants[colorVariantIndex] = {
          ...cv,
          stock: {
            ...cv.stock,
            [item.size]: currentStock - item.quantity,
          },
        };

        await ctx.db.patch(product._id, {
          colorVariants,
          updatedAt: now,
        });
      }

      itemsWithVariants.push({
        ...item,
        colorVariantId: result ? `cv-${result.colorVariantIndex}` : undefined,
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

    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const result = await findColorVariantBySelection(ctx, {
          productId: item.productId,
          color: item.color,
          size: item.size,
        });

        if (!result) {
          continue;
        }

        const { product, colorVariantIndex } = result;
        const colorVariants = [...(product.colorVariants ?? [])];
        const cv = colorVariants[colorVariantIndex];

        const currentStock = cv.stock?.[item.size] ?? 0;

        colorVariants[colorVariantIndex] = {
          ...cv,
          stock: {
            ...cv.stock,
            [item.size]: currentStock + item.quantity,
          },
        };

        await ctx.db.patch(product._id, {
          colorVariants,
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

export const getRevenueStats = query({
  args: {},
  handler: async (ctx) => {
    // Basic implementation: last 7 days revenue
    const now = new Date();
    const stats = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const startTime = date.getTime();
      
      const endTime = startTime + 24 * 60 * 60 * 1000;

      const dayOrders = await ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) => 
          q.gte("createdAt", startTime).lt("createdAt", endTime)
        )
        .collect();

      const revenue = dayOrders.reduce((sum, order) => {
        if (order.status === "cancelled") return sum;
        return sum + order.total;
      }, 0);

      stats.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        revenue,
      });
    }

    const totalOrders = await ctx.db.query("orders").collect();
    const lifetimeRevenue = totalOrders.reduce((sum, order) => {
      if (order.status === "cancelled") return sum;
      return sum + order.total;
    }, 0);

    return {
      daily: stats,
      lifetimeRevenue,
      totalOrders: totalOrders.length,
    };
  },
});

export const getRecentOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 10);
  },
});
