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
    const normalizedFilePath = args.filePath.trim();
    const normalizedFileUrl = args.fileUrl?.trim() || undefined;
    const normalizedThumbnailUrl = args.thumbnailUrl?.trim() || undefined;
    const normalizedAltText = args.altText?.trim() || undefined;

    if (!normalizedFilePath) {
      throw new Error("File path is required");
    }

    const relatedVariants = await ctx.db
      .query("productVariants")
      .withIndex("by_product_color", (q) =>
        q.eq("productId", variant.productId).eq("colorId", variant.colorId)
      )
      .collect();

    const targetVariantsMap = new Map<string, Id<"productVariants">>();
    targetVariantsMap.set(String(variant._id), variant._id);
    for (const related of relatedVariants) {
      targetVariantsMap.set(String(related._id), related._id);
    }
    const targetVariantIds = Array.from(targetVariantsMap.values());

    let selectedVariantMediaId: Id<"media"> | null = null;
    let firstAffectedMediaId: Id<"media"> | null = null;

    for (const targetVariantId of targetVariantIds) {
      if (args.isPrimary) {
        await clearVariantPrimaryMedia(ctx, targetVariantId);
      }

      const existingMedia = await ctx.db
        .query("media")
        .withIndex("by_variant", (q) => q.eq("variantId", targetVariantId))
        .collect();

      const activeMatchingMedia = existingMedia.find(
        (item) =>
          item.mediaType === args.mediaType &&
          item.filePath.trim() === normalizedFilePath
      );

      const maxDisplayOrder = existingMedia.reduce(
        (max, item) => Math.max(max, item.displayOrder),
        0
      );
      const nextDisplayOrder = args.displayOrder ?? maxDisplayOrder + 1;

      let affectedMediaId: Id<"media">;

      if (activeMatchingMedia) {
        affectedMediaId = activeMatchingMedia._id;
        await ctx.db.patch(activeMatchingMedia._id, {
          fileUrl: normalizedFileUrl,
          thumbnailUrl: normalizedThumbnailUrl,
          altText: normalizedAltText,
          displayOrder: nextDisplayOrder,
          isPrimary: Boolean(args.isPrimary),
          updatedAt: now,
        });
      } else {
        affectedMediaId = await ctx.db.insert("media", {
          variantId: targetVariantId,
          mediaType: args.mediaType,
          filePath: normalizedFilePath,
          fileUrl: normalizedFileUrl,
          thumbnailUrl: normalizedThumbnailUrl,
          altText: normalizedAltText,
          displayOrder: nextDisplayOrder,
          isPrimary: Boolean(args.isPrimary),
          createdAt: now,
          updatedAt: now,
        });
      }

      if (firstAffectedMediaId === null) {
        firstAffectedMediaId = affectedMediaId;
      }
      if (targetVariantId === args.variantId) {
        selectedVariantMediaId = affectedMediaId;
      }
    }

    if (selectedVariantMediaId) {
      return selectedVariantMediaId;
    }
    if (firstAffectedMediaId) {
      return firstAffectedMediaId;
    }

    throw new Error("Unable to create media");
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

    await ctx.db.delete(id);
  },
});
