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

interface ColorVariantInput {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  selectedSizes: string[];
  stock: Record<string, number>;
  measurements: Record<string, {
    shoulder?: number;
    chest?: number;
    sleeve?: number;
    waist?: number;
    length?: number;
  }>;
}

interface ProductVariant {
  _id: string;
  sku: string;
  productId: string;
  color: {
    id: string;
    name: string;
    nameMm?: string;
    hex: string;
  };
  sizeAvailability: {
    sizeId: string;
    sizeName: string;
    sizeNameMm?: string;
    sizeCategory: string;
    stock: number;
  }[];
  totalStock: number;
  displayOrder: number;
  isPrimary: boolean;
  price: number;
  media: {
    _id: string;
    mediaType: "image" | "video";
    filePath: string;
    fileUrl: string;
    thumbnailUrl?: string;
    altText?: string;
    displayOrder: number;
    isPrimary: boolean;
  }[];
  imageUrl: string;
  hasOwnMedia: boolean;
}

async function buildProductResponse(ctx: ReadCtx, product: Doc<"products">) {
  const colorVariants = product.colorVariants ?? [];
  const basePrice = product.basePrice ?? 0;

  const variantViews: ProductVariant[] = colorVariants.map((cv, index) => {
    const mediaViews = (cv.images ?? []).map((img, imgIndex) => ({
      _id: `${cv.id}-${imgIndex}`,
      mediaType: "image" as const,
      filePath: img,
      fileUrl: img,
      thumbnailUrl: undefined,
      altText: undefined,
      displayOrder: imgIndex,
      isPrimary: imgIndex === 0,
    }));

    const sizeAvailability = (cv.selectedSizes ?? []).map((size) => ({
      sizeId: size,
      sizeName: size,
      sizeNameMm: undefined,
      sizeCategory: "apparel",
      stock: cv.stock?.[size] ?? 0,
    }));

    const totalStock = sizeAvailability.reduce((sum, sa) => sum + sa.stock, 0);

    return {
      _id: cv.id,
      sku: `${product.sku ?? "PRD"}-${sanitizeSkuPart(cv.colorName).slice(0, 3) || "CLR"}-${index + 1}`,
      productId: product._id,
      color: {
        id: cv.id,
        name: cv.colorName || "Default",
        nameMm: undefined,
        hex: cv.colorHex || "#111111",
      },
      sizeAvailability,
      totalStock,
      displayOrder: index,
      isPrimary: index === 0,
      price: product.salePrice ?? basePrice,
      media: mediaViews,
      imageUrl: mediaViews[0]?.fileUrl ?? "",
      hasOwnMedia: mediaViews.length > 0,
    };
  });

  const defaultVariant = variantViews.find((v) => v.isPrimary) || variantViews[0];

  const images: string[] = (defaultVariant?.media ?? [])
    .filter((m) => m.mediaType === "image")
    .map((m) => m.fileUrl)
    .filter(Boolean);

  const colorMap = new Map<string, { name: string; hex: string; stock: number; order: number }>();
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
    const entry = colorMap.get(colorKey)!;
    entry.stock += variant.totalStock;
    entry.order = Math.min(entry.order, variant.displayOrder);
  }

  const sizeMap = new Map<string, { name: string; order: number }>();
  for (const variant of variantViews) {
    for (let i = 0; i < variant.sizeAvailability.length; i++) {
      const sa = variant.sizeAvailability[i];
      const sizeKey = String(sa.sizeId);
      if (!sizeMap.has(sizeKey)) {
        sizeMap.set(sizeKey, { name: sa.sizeName, order: i });
      }
    }
  }

  const colors: { name: string; hex: string; stock: number }[] = Array.from(colorMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ name, hex, stock }) => ({ name, hex, stock }));

  const sizes: string[] = Array.from(sizeMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ name }) => name);

  const stock = variantViews.reduce((sum, v) => sum + v.totalStock, 0);

  return {
    ...product,
    isPublished: product.isPublished !== false,
    price: basePrice,
    basePrice,
    images,
    imageRefs: images,
    sizes,
    colors,
    stock,
    isOutOfStock: stock <= 0,
    variants: variantViews,
  };
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

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

export const getCategoryFilters = query({
  args: { categorySlug: v.string() },
  handler: async (ctx, { categorySlug }) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
      .unique();

    if (!category) {
      return { sizes: [], colors: [] };
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", category._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const sizesSet = new Set<string>();
    const colorsMap = new Map<string, string>();

    for (const product of products) {
      if (product.colorVariants) {
        for (const cv of product.colorVariants) {
          if (cv.colorName) {
            colorsMap.set(cv.colorName, cv.colorHex);
          }
          if (cv.selectedSizes) {
            for (const s of cv.selectedSizes) {
              sizesSet.add(s);
            }
          }
        }
      }
    }

    const sizes = Array.from(sizesSet).sort();
    const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
      name,
      hex,
    }));

    return { sizes, colors };
  },
});

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
        args.sizes!.some((size) => (product.sizes ?? []).includes(size))
      );
    }

    if (args.colors && args.colors.length > 0) {
      hydrated = hydrated.filter((product) =>
        args.colors!.some((name) =>
          (product.colors ?? []).some((color) => color.name.toLowerCase() === name.toLowerCase())
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

export const create = mutation({
  args: {
    name: v.string(),
    nameMm: v.optional(v.string()),
    slug: v.string(),
    description: v.string(),
    descriptionMm: v.optional(v.string()),
    price: v.number(),
    salePrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    colorVariants: v.array(v.object({
      id: v.string(),
      colorName: v.string(),
      colorHex: v.string(),
      images: v.array(v.string()),
      selectedSizes: v.array(v.string()),
      stock: v.record(v.string(), v.number()),
      measurements: v.record(v.string(), v.object({
        shoulder: v.optional(v.number()),
        chest: v.optional(v.number()),
        sleeve: v.optional(v.number()),
        waist: v.optional(v.number()),
        length: v.optional(v.number()),
      })),
    })),
    sku: v.optional(v.string()),
    isFeatured: v.boolean(),
    isPublished: v.optional(v.boolean()),
    careInstructions: v.optional(v.string()),
    sizeFit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sku = args.sku?.trim() || buildProductSku(args.name, args.slug);

    const totalStock = args.colorVariants.reduce((sum, cv) => {
      return sum + Object.values(cv.stock).reduce((s, v) => s + v, 0);
    }, 0);

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
      colorVariants: args.colorVariants,
      createdAt: now,
      updatedAt: now,
    });

    return productId;
  },
});

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
      categoryId: v.optional(v.id("categories")),
      colorVariants: v.optional(v.array(v.object({
        id: v.string(),
        colorName: v.string(),
        colorHex: v.string(),
        images: v.array(v.string()),
        selectedSizes: v.array(v.string()),
        stock: v.record(v.string(), v.number()),
        measurements: v.record(v.string(), v.object({
          shoulder: v.optional(v.number()),
          chest: v.optional(v.number()),
          sleeve: v.optional(v.number()),
          waist: v.optional(v.number()),
          length: v.optional(v.number()),
        })),
      }))),
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

    const nextPrice = updates.price ?? product.basePrice ?? 0;

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
      isActive: updates.isActive ?? product.isActive ?? true,
      careInstructions: updates.careInstructions,
      sizeFit: updates.sizeFit,
      colorVariants: updates.colorVariants,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

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

    const result = [];

    for (const product of products) {
      const hydrated = await buildProductResponse(ctx, product);
      if (hydrated.stock <= threshold) {
        result.push(hydrated);
      }
    }

    return result;
  },
});

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

export const fixIsActive = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let fixed = 0;
    for (const product of products) {
      if (product.isActive === undefined) {
        await ctx.db.patch(product._id, { isActive: true });
        fixed++;
      }
    }
    return { fixed };
  },
});
