import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function clearVariantPrimaryMedia(
  ctx: MutationCtx,
  variantId: Id<"productVariants">
) {
  const mediaList = await ctx.db
    .query("media")
    .withIndex("by_variant", (q) => q.eq("variantId", variantId))
    .collect();

  for (const item of mediaList) {
    if (item.isPrimary) {
      await ctx.db.patch(item._id, {
        isPrimary: false,
        updatedAt: Date.now(),
      });
    }
  }
}

export const getAll = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    variantId: v.optional(v.id("productVariants")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let mediaList;

    if (args.variantId) {
      mediaList = await ctx.db
        .query("media")
        .withIndex("by_variant", (q) => q.eq("variantId", args.variantId!))
        .collect();
    } else {
      mediaList = await ctx.db.query("media").collect();
    }

    if (!args.includeInactive) {
      mediaList = mediaList.filter((item) => item.isActive);
    }

    mediaList.sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);

    if (args.limit) {
      mediaList = mediaList.slice(0, args.limit);
    }

    return await Promise.all(
      mediaList.map(async (item) => {
        const variant = await ctx.db.get(item.variantId);
        const [product, color, size] = variant
          ? await Promise.all([
              ctx.db.get(variant.productId),
              ctx.db.get(variant.colorId),
              ctx.db.get(variant.sizeId),
            ])
          : [null, null, null];

        return {
          ...item,
          productName: product?.name ?? "Unknown Product",
          variantSku: variant?.skuVariant ?? "Unknown Variant",
          colorName: color?.name ?? "",
          sizeName: size?.name ?? "",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    variantId: v.id("productVariants"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    filePath: v.string(),
    fileUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    altText: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const variant = await ctx.db.get(args.variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }

    const now = Date.now();

    if (args.isPrimary) {
      await clearVariantPrimaryMedia(ctx, args.variantId);
    }

    const maxDisplayOrder = (await ctx.db
      .query("media")
      .withIndex("by_variant", (q) => q.eq("variantId", args.variantId))
      .collect()
    ).reduce((max, item) => Math.max(max, item.displayOrder), 0);

    return await ctx.db.insert("media", {
      variantId: args.variantId,
      mediaType: args.mediaType,
      filePath: args.filePath.trim(),
      fileUrl: args.fileUrl?.trim() || undefined,
      thumbnailUrl: args.thumbnailUrl?.trim() || undefined,
      altText: args.altText?.trim() || undefined,
      displayOrder: args.displayOrder ?? maxDisplayOrder + 1,
      isPrimary: Boolean(args.isPrimary),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("media"),
    updates: v.object({
      variantId: v.optional(v.id("productVariants")),
      mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
      filePath: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      altText: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isPrimary: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Media not found");
    }

    const nextVariantId = updates.variantId ?? existing.variantId;

    if (updates.isPrimary) {
      await clearVariantPrimaryMedia(ctx, nextVariantId);
    }

    await ctx.db.patch(id, {
      ...updates,
      filePath: updates.filePath?.trim(),
      fileUrl: updates.fileUrl?.trim(),
      thumbnailUrl: updates.thumbnailUrl?.trim(),
      altText: updates.altText?.trim(),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("media"),
  },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Media not found");
    }

    await ctx.db.patch(id, {
      isActive: false,
      isPrimary: false,
      updatedAt: Date.now(),
    });
  },
});
