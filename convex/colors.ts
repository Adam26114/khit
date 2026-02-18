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
    const colors = await ctx.db.query("colors").collect();
    return colors.sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameMm: v.optional(v.string()),
    hexCode: v.string(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const maxDisplayOrder = (await ctx.db.query("colors").collect()).reduce(
      (max, color) => Math.max(max, color.displayOrder),
      0
    );

    return await ctx.db.insert("colors", {
      name: args.name.trim(),
      nameMm: args.nameMm?.trim() || undefined,
      hexCode: args.hexCode.trim() || "#111111",
      displayOrder: args.displayOrder ?? maxDisplayOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("colors"),
    updates: v.object({
      name: v.optional(v.string()),
      nameMm: v.optional(v.string()),
      hexCode: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Color not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("colors"),
  },
  handler: async (ctx, { id }): Promise<{ deletedVariants: number }> => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Color not found");
    }

    const relatedVariants = (await ctx.db.query("productVariants").collect()).filter(
      (variant) => variant.colorId === id
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
