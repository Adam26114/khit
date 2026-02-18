import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type ReadCtx = QueryCtx | MutationCtx;

type LegacyColorInput = {
  name: string;
  hex: string;
  stock: number;
};

function startsWithKnownUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("api/storage/") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  );
}

function looksLikeStorageId(value: string): boolean {
  return /^[a-z0-9]{20,}$/.test(value);
}

function sanitizeSkuPart(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function buildProductSku(name: string, slug: string): string {
  const base = sanitizeSkuPart(slug || name) || "PRD";
  const ts = Date.now().toString(36).toUpperCase();
  return `${base}-${ts}`;
}

function normalizeMediaInput(value: string): {
  mediaType: "image" | "video";
  filePath: string;
  fileUrl?: string;
} {
  const lower = value.toLowerCase();
  const isVideo =
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".m4v") ||
    lower.includes("video");

  if (startsWithKnownUrl(value)) {
    return {
      mediaType: isVideo ? "video" : "image",
      filePath: value,
      fileUrl: value,
    };
  }

  return {
    mediaType: isVideo ? "video" : "image",
    filePath: value,
  };
}

async function resolveMediaUrl(
  ctx: ReadCtx,
  filePath: string,
  fileUrl?: string | null
): Promise<string> {
  const preferred = fileUrl || filePath;

  if (!preferred) {
    return "";
  }

  if (startsWithKnownUrl(preferred)) {
    return preferred;
  }

  if (!looksLikeStorageId(preferred)) {
    return "";
  }

  try {
    const signed = await ctx.storage.getUrl(preferred as Id<"_storage">);
    return signed || "";
  } catch {
    return "";
  }
}

async function resolveLegacyImages(ctx: ReadCtx, images: string[]): Promise<string[]> {
  const resolved = await Promise.all(
    (images || []).map((image) => resolveMediaUrl(ctx, image))
  );
  return resolved.filter(Boolean);
}

async function getOrCreateColor(
  ctx: MutationCtx,
  color: { name: string; hex: string },
  displayOrder: number
): Promise<Id<"colors">> {
  const normalizedName = color.name.trim();
  const normalizedHex = color.hex.trim() || "#111111";

  const existingByName = await ctx.db
    .query("colors")
    .withIndex("by_name", (q) => q.eq("name", normalizedName))
    .collect();

  const existing =
    existingByName.find(
      (entry) => entry.hexCode.toLowerCase() === normalizedHex.toLowerCase()
    ) || existingByName[0];

  if (existing) {
    await ctx.db.patch(existing._id, {
      name: normalizedName,
      hexCode: normalizedHex,
      displayOrder: Math.min(existing.displayOrder, displayOrder),
      isActive: true,
      updatedAt: Date.now(),
    });
    return existing._id;
  }

  return await ctx.db.insert("colors", {
    name: normalizedName,
    nameMm: undefined,
    hexCode: normalizedHex,
    displayOrder,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

async function getOrCreateSize(
  ctx: MutationCtx,
  sizeName: string,
  displayOrder: number
): Promise<Id<"sizes">> {
  const normalizedName = sizeName.trim().toUpperCase() || "ONE SIZE";

  const existingByName = await ctx.db
    .query("sizes")
    .withIndex("by_name", (q) => q.eq("name", normalizedName))
    .collect();

  const existing = existingByName[0];
  if (existing) {
    await ctx.db.patch(existing._id, {
      displayOrder: Math.min(existing.displayOrder, displayOrder),
      isActive: true,
      updatedAt: Date.now(),
    });
    return existing._id;
  }

  return await ctx.db.insert("sizes", {
    name: normalizedName,
    nameMm: undefined,
    sizeCategory: "apparel",
    displayOrder,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

function rotateList<T>(items: T[], fromIndex: number): T[] {
  if (items.length === 0) return [];
  const pivot = fromIndex % items.length;
  return [...items.slice(pivot), ...items.slice(0, pivot)];
}

async function removeVariantsAndMedia(
  ctx: MutationCtx,
  productId: Id<"products">
): Promise<void> {
  const variants = await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();

  for (const variant of variants) {
    const medias = await ctx.db
      .query("media")
      .withIndex("by_variant", (q) => q.eq("variantId", variant._id))
      .collect();

    for (const media of medias) {
      await ctx.db.delete(media._id);
    }

    await ctx.db.delete(variant._id);
  }
}

async function rebuildVariantsAndMedia(
  ctx: MutationCtx,
  params: {
    productId: Id<"products">;
    productSku: string;
    sizes: string[];
    colors: LegacyColorInput[];
    images: string[];
    stock?: number;
  }
): Promise<void> {
  const now = Date.now();
  const normalizedSizes = (params.sizes || [])
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean);
  const finalSizes = normalizedSizes.length > 0 ? normalizedSizes : ["ONE SIZE"];

  const normalizedColors = (params.colors || [])
    .map((color) => ({
      name: color.name.trim() || "Default",
      hex: color.hex.trim() || "#111111",
      stock: Math.max(0, Number(color.stock) || 0),
    }))
    .filter((color) => Boolean(color.name));

  const finalColors =
    normalizedColors.length > 0
      ? normalizedColors
      : [{ name: "Default", hex: "#111111", stock: Math.max(0, params.stock ?? 0) }];

  const totalStockFromColors = finalColors.reduce((sum, color) => sum + color.stock, 0);
  const totalStock = Math.max(0, params.stock ?? totalStockFromColors);
  const colorCount = Math.max(finalColors.length, 1);
  const defaultPerColor = Math.floor(totalStock / colorCount);
  const defaultColorRemainder = totalStock % colorCount;

  await removeVariantsAndMedia(ctx, params.productId);

  for (let colorIndex = 0; colorIndex < finalColors.length; colorIndex++) {
    const color = finalColors[colorIndex];
    const colorId = await getOrCreateColor(ctx, color, colorIndex);

    const fallbackColorStock = defaultPerColor + (colorIndex < defaultColorRemainder ? 1 : 0);
    const colorStock = color.stock > 0 ? color.stock : fallbackColorStock;

    const sizeCount = Math.max(finalSizes.length, 1);
    const defaultPerSize = Math.floor(colorStock / sizeCount);
    const defaultSizeRemainder = colorStock % sizeCount;

    for (let sizeIndex = 0; sizeIndex < finalSizes.length; sizeIndex++) {
      const sizeName = finalSizes[sizeIndex];
      const sizeId = await getOrCreateSize(ctx, sizeName, sizeIndex);
      const stockQuantity = defaultPerSize + (sizeIndex < defaultSizeRemainder ? 1 : 0);

      const skuVariant = `${params.productSku}-${sanitizeSkuPart(color.name).slice(0, 3) || "CLR"}-${sanitizeSkuPart(sizeName) || "OS"}-${colorIndex + 1}${sizeIndex + 1}`;

      const variantId = await ctx.db.insert("productVariants", {
        productId: params.productId,
        colorId,
        sizeId,
        skuVariant,
        priceOverride: undefined,
        stockQuantity,
        displayOrder: colorIndex * 100 + sizeIndex,
        isPrimary: colorIndex === 0 && sizeIndex === 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const orderedImages = rotateList(params.images || [], colorIndex);
      for (let mediaIndex = 0; mediaIndex < orderedImages.length; mediaIndex++) {
        const mediaInput = normalizeMediaInput(orderedImages[mediaIndex]);
        await ctx.db.insert("media", {
          variantId,
          mediaType: mediaInput.mediaType,
          filePath: mediaInput.filePath,
          fileUrl: mediaInput.fileUrl,
          thumbnailUrl: undefined,
          altText: undefined,
          displayOrder: mediaIndex,
          isPrimary: mediaIndex === 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
}

async function buildProductResponse(ctx: ReadCtx, product: Doc<"products">) {
  const variants = await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", product._id))
    .collect();

  const activeVariants = variants
    .filter((variant) => variant.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);

  const basePrice = product.basePrice ?? product.price ?? 0;

  // Fallback for legacy rows that do not yet have variants/media.
  if (activeVariants.length === 0) {
    const legacyImages = await resolveLegacyImages(ctx, product.images ?? []);
    const legacyColors = product.colors ?? [];
    const fallbackStock =
      typeof product.stock === "number"
        ? product.stock
        : legacyColors.reduce((sum, color) => sum + (color.stock || 0), 0);

    return {
      ...product,
      isPublished: product.isPublished !== false,
      price: basePrice,
      basePrice,
      images: legacyImages,
      imageRefs: product.images ?? [],
      sizes: product.sizes ?? [],
      colors: legacyColors,
      stock: Math.max(0, fallbackStock),
      isOutOfStock:
        typeof product.isOutOfStock === "boolean"
          ? product.isOutOfStock
          : Math.max(0, fallbackStock) <= 0,
      variants: [],
    };
  }

  const colorCache = new Map<string, Doc<"colors"> | null>();
  const sizeCache = new Map<string, Doc<"sizes"> | null>();

  for (const variant of activeVariants) {
    const colorKey = String(variant.colorId);
    if (!colorCache.has(colorKey)) {
      colorCache.set(colorKey, await ctx.db.get(variant.colorId));
    }

    const sizeKey = String(variant.sizeId);
    if (!sizeCache.has(sizeKey)) {
      sizeCache.set(sizeKey, await ctx.db.get(variant.sizeId));
    }
  }

  const mediaByVariant = new Map<string, Doc<"media">[]>();
  await Promise.all(
    activeVariants.map(async (variant) => {
      const mediaList = await ctx.db
        .query("media")
        .withIndex("by_variant", (q) => q.eq("variantId", variant._id))
        .collect();

      mediaByVariant.set(
        String(variant._id),
        mediaList
          .filter((media) => media.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt)
      );
    })
  );

  const variantsByColor = new Map<string, Doc<"productVariants">[]>();
  for (const variant of activeVariants) {
    const colorKey = String(variant.colorId);
    const list = variantsByColor.get(colorKey) || [];
    list.push(variant);
    variantsByColor.set(colorKey, list);
  }
  Array.from(variantsByColor.values()).forEach((list) => {
    list.sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
  });

  const mediaUrlCache = new Map<string, string>();
  const toMediaView = async (media: Doc<"media">) => {
    const cacheKey = `${media.filePath}|${media.fileUrl ?? ""}`;
    let resolvedUrl = mediaUrlCache.get(cacheKey);
    if (resolvedUrl === undefined) {
      resolvedUrl = await resolveMediaUrl(ctx, media.filePath, media.fileUrl);
      mediaUrlCache.set(cacheKey, resolvedUrl);
    }

    return {
      _id: media._id,
      mediaType: media.mediaType,
      filePath: media.filePath,
      fileUrl: resolvedUrl,
      thumbnailUrl: media.thumbnailUrl,
      altText: media.altText,
      displayOrder: media.displayOrder,
      isPrimary: media.isPrimary,
    };
  };

  const getOwnMediaDocs = (variantId: Id<"productVariants">) =>
    mediaByVariant.get(String(variantId)) ?? [];

  const getSameColorFallbackDocs = (variant: Doc<"productVariants">) => {
    const sameColorVariants = variantsByColor.get(String(variant.colorId)) ?? [];
    for (const candidate of sameColorVariants) {
      if (candidate._id === variant._id) continue;
      const candidateMedia = getOwnMediaDocs(candidate._id);
      if (candidateMedia.length > 0) {
        return candidateMedia;
      }
    }
    return [] as Doc<"media">[];
  };

  let globalFallbackDocs: Doc<"media">[] = [];
  for (const candidate of activeVariants) {
    const candidateMedia = getOwnMediaDocs(candidate._id);
    if (candidateMedia.length > 0) {
      globalFallbackDocs = candidateMedia;
      break;
    }
  }

  const legacyImageFallback =
    globalFallbackDocs.length === 0 ? await resolveLegacyImages(ctx, product.images ?? []) : [];
  const legacyMediaFallback = legacyImageFallback.map((image, index) => ({
    _id: (`legacy-${String(product._id)}-${index}` as unknown) as Id<"media">,
    mediaType: "image" as const,
    filePath: image,
    fileUrl: image,
    thumbnailUrl: undefined,
    altText: undefined,
    displayOrder: index,
    isPrimary: index === 0,
  }));

  const variantViews = await Promise.all(
    activeVariants.map(async (variant) => {
      const ownMediaDocs = getOwnMediaDocs(variant._id);
      const sameColorFallbackDocs =
        ownMediaDocs.length > 0 ? [] : getSameColorFallbackDocs(variant);
      const effectiveMediaDocs =
        ownMediaDocs.length > 0
          ? ownMediaDocs
          : sameColorFallbackDocs.length > 0
            ? sameColorFallbackDocs
            : globalFallbackDocs;

      const mediaViews =
        effectiveMediaDocs.length > 0
          ? await Promise.all(effectiveMediaDocs.map((media) => toMediaView(media)))
          : legacyMediaFallback;

      const color = colorCache.get(String(variant.colorId));
      const size = sizeCache.get(String(variant.sizeId));
      const firstImage =
        mediaViews.find((media) => media.mediaType === "image" && Boolean(media.fileUrl)) ??
        null;

      return {
        _id: variant._id,
        sku: variant.skuVariant,
        productId: variant.productId,
        color: {
          id: variant.colorId,
          name: color?.name ?? "Default",
          nameMm: color?.nameMm,
          hex: color?.hexCode ?? "#111111",
        },
        size: {
          id: variant.sizeId,
          name: size?.name ?? "ONE SIZE",
          nameMm: size?.nameMm,
          category: size?.sizeCategory ?? "apparel",
        },
        stock: variant.stockQuantity,
        displayOrder: variant.displayOrder,
        isPrimary: variant.isPrimary,
        price: variant.priceOverride ?? product.salePrice ?? basePrice,
        media: mediaViews,
        imageUrl: firstImage?.fileUrl ?? "",
        hasOwnMedia: ownMediaDocs.length > 0,
      };
    })
  );

  const defaultVariant =
    variantViews.find((variant) => variant.isPrimary) || variantViews[0];

  let images = (defaultVariant?.media || [])
    .filter((media) => media.mediaType === "image")
    .map((media) => media.fileUrl)
    .filter(Boolean);

  if (images.length === 0 && legacyImageFallback.length > 0) {
    images = legacyImageFallback;
  }

  let imageRefs = (defaultVariant?.media || [])
    .filter((media) => media.mediaType === "image")
    .map((media) => media.filePath)
    .filter(Boolean);

  if (imageRefs.length === 0) {
    imageRefs = product.images ?? [];
  }

  const colorMap = new Map<
    string,
    { name: string; hex: string; stock: number; order: number }
  >();

  const sizeMap = new Map<string, { name: string; order: number }>();

  for (const variant of variantViews) {
    const colorKey = String(variant.color.id);
    if (!colorMap.has(colorKey)) {
      colorMap.set(colorKey, {
        name: variant.color.name,
        hex: variant.color.hex,
        stock: 0,
        order: variant.displayOrder,
      });
    }

    const colorEntry = colorMap.get(colorKey)!;
    colorEntry.stock += variant.stock;
    colorEntry.order = Math.min(colorEntry.order, variant.displayOrder);

    const sizeKey = String(variant.size.id);
    if (!sizeMap.has(sizeKey)) {
      sizeMap.set(sizeKey, {
        name: variant.size.name,
        order: variant.displayOrder,
      });
    } else {
      sizeMap.get(sizeKey)!.order = Math.min(
        sizeMap.get(sizeKey)!.order,
        variant.displayOrder
      );
    }
  }

  const colors = Array.from(colorMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ name, hex, stock }) => ({ name, hex, stock }));

  const sizes = Array.from(sizeMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ name }) => name);

  const stock = variantViews.reduce((sum, variant) => sum + variant.stock, 0);

  return {
    ...product,
    isPublished: product.isPublished !== false,
    price: basePrice,
    basePrice,
    images,
    imageRefs,
    sizes,
    colors,
    stock,
    isOutOfStock: stock <= 0,
    variants: variantViews,
  };
}

// Generate a signed URL for uploading images.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get signed URL for a storage file.
export const getStorageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

// Get featured products for homepage.
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("isPublished"), false)
        )
      )
      .take(12);

    return await Promise.all(products.map((product) => buildProductResponse(ctx, product)));
  },
});

// Get products by category slug.
export const getByCategory = query({
  args: { categorySlug: v.string() },
  handler: async (ctx, { categorySlug }) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
      .unique();

    if (!category) {
      return [];
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", category._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("isPublished"), false)
        )
      )
      .collect();

    return await Promise.all(products.map((product) => buildProductResponse(ctx, product)));
  },
});

// Get single product by slug.
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!product || !product.isActive || product.isPublished === false) {
      return null;
    }

    return await buildProductResponse(ctx, product);
  },
});

// Search products by text.
export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const publishedProducts = products.filter((product) => product.isPublished !== false);

    const term = searchQuery.trim().toLowerCase();
    const filtered = publishedProducts.filter((product) => {
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();
      const nameMm = (product.nameMm || "").toLowerCase();
      const descriptionMm = (product.descriptionMm || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();

      return (
        name.includes(term) ||
        description.includes(term) ||
        nameMm.includes(term) ||
        descriptionMm.includes(term) ||
        sku.includes(term)
      );
    });

    return await Promise.all(filtered.map((product) => buildProductResponse(ctx, product)));
  },
});

// Filter products with multiple criteria.
export const filterProducts = query({
  args: {
    categorySlug: v.optional(v.string()),
    sizes: v.optional(v.array(v.string())),
    colors: v.optional(v.array(v.string())),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("price-low"),
        v.literal("price-high"),
        v.literal("sale")
      )
    ),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    products = products.filter((product) => product.isPublished !== false);

    if (args.categorySlug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
        .unique();

      if (!category) {
        return [];
      }

      products = products.filter((product) => product.categoryId === category._id);
    }

    let hydrated = await Promise.all(products.map((product) => buildProductResponse(ctx, product)));

    if (args.sizes && args.sizes.length > 0) {
      hydrated = hydrated.filter((product) =>
        args.sizes!.some((size) => product.sizes.includes(size))
      );
    }

    if (args.colors && args.colors.length > 0) {
      hydrated = hydrated.filter((product) =>
        args.colors!.some((name) =>
          product.colors.some((color) => color.name.toLowerCase() === name.toLowerCase())
        )
      );
    }

    if (typeof args.minPrice === "number") {
      hydrated = hydrated.filter(
        (product) => (product.salePrice ?? product.price) >= args.minPrice!
      );
    }

    if (typeof args.maxPrice === "number") {
      hydrated = hydrated.filter(
        (product) => (product.salePrice ?? product.price) <= args.maxPrice!
      );
    }

    if (args.sortBy) {
      switch (args.sortBy) {
        case "newest":
          hydrated.sort((a, b) => b.createdAt - a.createdAt);
          break;
        case "price-low":
          hydrated.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
          break;
        case "price-high":
          hydrated.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
          break;
        case "sale":
          hydrated = hydrated.filter((product) => typeof product.salePrice === "number");
          break;
      }
    }

    return hydrated;
  },
});

// Create new product.
export const create = mutation({
  args: {
    name: v.string(),
    nameMm: v.optional(v.string()),
    slug: v.string(),
    description: v.string(),
    descriptionMm: v.optional(v.string()),
    price: v.number(),
    salePrice: v.optional(v.number()),
    images: v.array(v.string()),
    categoryId: v.id("categories"),
    sizes: v.array(v.string()),
    colors: v.array(
      v.object({
        name: v.string(),
        hex: v.string(),
        stock: v.number(),
      })
    ),
    stock: v.optional(v.number()),
    sku: v.optional(v.string()),
    isFeatured: v.boolean(),
    isPublished: v.optional(v.boolean()),
    careInstructions: v.optional(v.string()),
    sizeFit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sku = args.sku?.trim() || buildProductSku(args.name, args.slug);
    const stock = Math.max(
      0,
      args.stock ?? args.colors.reduce((sum, color) => sum + Math.max(0, color.stock), 0)
    );

    const productId = await ctx.db.insert("products", {
      sku,
      name: args.name,
      nameMm: args.nameMm,
      slug: args.slug,
      description: args.description,
      descriptionMm: args.descriptionMm,
      categoryId: args.categoryId,
      basePrice: args.price,
      salePrice: args.salePrice,
      isFeatured: args.isFeatured,
      isPublished: args.isPublished ?? true,
      isActive: true,
      careInstructions: args.careInstructions,
      sizeFit: args.sizeFit,
      // Legacy compatibility fields.
      price: args.price,
      images: args.images,
      sizes: args.sizes,
      colors: args.colors,
      stock,
      isOutOfStock: stock <= 0,
      createdAt: now,
      updatedAt: now,
    });

    await rebuildVariantsAndMedia(ctx, {
      productId,
      productSku: sku,
      sizes: args.sizes,
      colors: args.colors,
      images: args.images,
      stock,
    });

    return productId;
  },
});

// Update product.
export const update = mutation({
  args: {
    id: v.id("products"),
    updates: v.object({
      name: v.optional(v.string()),
      nameMm: v.optional(v.string()),
      sku: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      descriptionMm: v.optional(v.string()),
      price: v.optional(v.number()),
      salePrice: v.optional(v.number()),
      images: v.optional(v.array(v.string())),
      categoryId: v.optional(v.id("categories")),
      sizes: v.optional(v.array(v.string())),
      colors: v.optional(
        v.array(
          v.object({
            name: v.string(),
            hex: v.string(),
            stock: v.number(),
          })
        )
      ),
      stock: v.optional(v.number()),
      isOutOfStock: v.optional(v.boolean()),
      isFeatured: v.optional(v.boolean()),
      isPublished: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
      careInstructions: v.optional(v.string()),
      sizeFit: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const product = await ctx.db.get(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const nextPrice = updates.price ?? product.basePrice ?? product.price ?? 0;
    const nextSizes = updates.sizes ?? product.sizes ?? [];
    const nextColors = updates.colors ?? product.colors ?? [];
    const nextImages = updates.images ?? product.images ?? [];

    const nextStock = Math.max(
      0,
      updates.stock ??
        product.stock ??
        nextColors.reduce((sum, color) => sum + Math.max(0, color.stock), 0)
    );

    await ctx.db.patch(id, {
      name: updates.name,
      nameMm: updates.nameMm,
      sku: updates.sku,
      slug: updates.slug,
      description: updates.description,
      descriptionMm: updates.descriptionMm,
      basePrice: nextPrice,
      salePrice: updates.salePrice,
      categoryId: updates.categoryId,
      isFeatured: updates.isFeatured,
      isPublished: updates.isPublished,
      isActive: updates.isActive,
      careInstructions: updates.careInstructions,
      sizeFit: updates.sizeFit,
      // Legacy compatibility fields.
      price: nextPrice,
      images: nextImages,
      sizes: nextSizes,
      colors: nextColors,
      stock: nextStock,
      isOutOfStock:
        typeof updates.isOutOfStock === "boolean"
          ? updates.isOutOfStock
          : nextStock <= 0,
      updatedAt: Date.now(),
    });

    const shouldRebuildVariants =
      updates.sizes !== undefined ||
      updates.colors !== undefined ||
      updates.images !== undefined ||
      updates.stock !== undefined;

    if (shouldRebuildVariants) {
      await rebuildVariantsAndMedia(ctx, {
        productId: id,
        productSku:
          updates.sku?.trim() ||
          product.sku ||
          buildProductSku(updates.name ?? product.name, updates.slug ?? product.slug),
        sizes: nextSizes,
        colors: nextColors,
        images: nextImages,
        stock: nextStock,
      });
    }
  },
});

// Delete product (soft delete).
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", id))
      .collect();

    for (const variant of variants) {
      await ctx.db.patch(variant._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Update stock for a product by distributing across active variants.
export const updateStock = mutation({
  args: {
    id: v.id("products"),
    stock: v.number(),
  },
  handler: async (ctx, { id, stock }) => {
    const product = await ctx.db.get(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", id))
      .collect();

    const activeVariants = variants.filter((variant) => variant.isActive);
    const count = Math.max(activeVariants.length, 1);
    const totalStock = Math.max(0, stock);
    const perVariant = Math.floor(totalStock / count);
    const remainder = totalStock % count;

    for (let i = 0; i < activeVariants.length; i++) {
      await ctx.db.patch(activeVariants[i]._id, {
        stockQuantity: perVariant + (i < remainder ? 1 : 0),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(id, {
      stock: totalStock,
      isOutOfStock: totalStock <= 0,
      updatedAt: Date.now(),
    });
  },
});

// Get total active product count.
export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return products.length;
  },
});

// Get low stock products.
export const getLowStock = query({
  args: {
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold ?? 5;
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const result: Awaited<ReturnType<typeof buildProductResponse>>[] = [];

    for (const product of products) {
      const hydrated = await buildProductResponse(ctx, product);
      if (hydrated.stock <= threshold) {
        result.push(hydrated);
      }
    }

    return result;
  },
});

// Get all products (admin).
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let products;

    if (args.includeInactive) {
      products = await ctx.db.query("products").collect();
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    products.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return await Promise.all(products.map((product) => buildProductResponse(ctx, product)));
  },
});

// One-time helper to migrate legacy products into variants/media model.
export const migrateLegacyProductsToVariantModel = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, { dryRun }) => {
    const products = await ctx.db.query("products").collect();

    let scanned = 0;
    let migrated = 0;

    for (const product of products) {
      scanned += 1;

      const existingVariants = await ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .collect();

      if (existingVariants.length > 0) {
        continue;
      }

      const legacySizes = product.sizes ?? [];
      const legacyColors = product.colors ?? [];
      const legacyImages = product.images ?? [];
      const basePrice = product.basePrice ?? product.price ?? 0;
      const stock =
        product.stock ??
        legacyColors.reduce((sum, color) => sum + Math.max(0, color.stock), 0);
      const sku = product.sku || buildProductSku(product.name, product.slug);

      if (dryRun) {
        migrated += 1;
        continue;
      }

      await ctx.db.patch(product._id, {
        sku,
        basePrice,
        price: basePrice,
        stock,
        isOutOfStock: stock <= 0,
        updatedAt: Date.now(),
      });

      await rebuildVariantsAndMedia(ctx, {
        productId: product._id,
        productSku: sku,
        sizes: legacySizes,
        colors: legacyColors,
        images: legacyImages,
        stock,
      });

      migrated += 1;
    }

    return {
      scanned,
      migrated,
      dryRun: Boolean(dryRun),
    };
  },
});
