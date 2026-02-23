import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        
        const colorVariants = product?.colorVariants ?? [];
        const colorVariant = item.colorVariantId 
          ? colorVariants.find(cv => cv.id === item.colorVariantId)
          : null;

        return {
          ...item,
          product,
          colorVariant,
        };
      })
    );
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    colorVariantId: v.optional(v.string()),
    size: v.optional(v.string()),
  },
  handler: async (ctx, { userId, productId, colorVariantId, size }) => {
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", productId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("wishlistItems", {
      userId,
      productId,
      colorVariantId,
      size,
      addedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
  },
  handler: async (ctx, { userId, productId }) => {
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", productId)
      )
      .unique();

    if (!existing) {
      return;
    }

    await ctx.db.delete(existing._id);
  },
});
