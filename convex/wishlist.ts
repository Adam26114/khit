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
        const variant = await ctx.db.get(item.variantId);
        const product = variant ? await ctx.db.get(variant.productId) : null;
        const color = variant ? await ctx.db.get(variant.colorId) : null;
        const size = variant ? await ctx.db.get(variant.sizeId) : null;

        return {
          ...item,
          variant,
          product,
          color,
          size,
        };
      })
    );
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    variantId: v.id("productVariants"),
  },
  handler: async (ctx, { userId, variantId }) => {
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_variant", (q) =>
        q.eq("userId", userId).eq("variantId", variantId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("wishlistItems", {
      userId,
      variantId,
      addedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    variantId: v.id("productVariants"),
  },
  handler: async (ctx, { userId, variantId }) => {
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_variant", (q) =>
        q.eq("userId", userId).eq("variantId", variantId)
      )
      .unique();

    if (!existing) {
      return;
    }

    await ctx.db.delete(existing._id);
  },
});
