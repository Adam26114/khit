import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function deleteVariantCascade(
  ctx: MutationCtx,
  variantId: Id<"productVariants">
) {
  const [mediaItems, cartItems, wishlistItems] = await Promise.all([
    ctx.db
      .query("media")
      .withIndex("by_variant", (q) => q.eq("variantId", variantId))
      .collect(),
    ctx.db.query("cartItems").collect(),
    ctx.db.query("wishlistItems").collect(),
  ]);

  for (const media of mediaItems) {
    await ctx.db.delete(media._id);
  }

  for (const item of cartItems) {
    if (item.variantId === variantId) {
      await ctx.db.delete(item._id);
    }
  }

  for (const item of wishlistItems) {
    if (item.variantId === variantId) {
      await ctx.db.delete(item._id);
    }
  }

  await ctx.db.delete(variantId);
}

export const getAll = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx) => {
    const sizes = await ctx.db.query("sizes").collect();
    return sizes.sort(
      (a, b) =>
        a.sizeCategory.localeCompare(b.sizeCategory) ||
        a.displayOrder - b.displayOrder ||
        a.name.localeCompare(b.name)
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameMm: v.optional(v.string()),
    sizeCategory: v.string(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const maxDisplayOrder = (await ctx.db.query("sizes").collect()).reduce(
      (max, size) => Math.max(max, size.displayOrder),
      0
    );

    return await ctx.db.insert("sizes", {
      name: args.name.trim().toUpperCase(),
      nameMm: args.nameMm?.trim() || undefined,
      sizeCategory: args.sizeCategory.trim() || "apparel",
      displayOrder: args.displayOrder ?? maxDisplayOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sizes"),
    updates: v.object({
      name: v.optional(v.string()),
      nameMm: v.optional(v.string()),
      sizeCategory: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Size not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      name: updates.name ? updates.name.trim().toUpperCase() : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("sizes"),
  },
  handler: async (ctx, { id }): Promise<{ deletedVariants: number }> => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Size not found");
    }

    const relatedVariants = (await ctx.db.query("productVariants").collect()).filter(
      (variant) => variant.sizeId === id
    );

    for (const variant of relatedVariants) {
      await deleteVariantCascade(ctx, variant._id);
    }

    await ctx.db.delete(id);

    return {
      deletedVariants: relatedVariants.length,
    };
  },
});
