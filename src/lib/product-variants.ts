/**
 * Product variant utility functions for the storefront.
 *
 * Variants follow the MANGO model: one variant per color, each containing
 * a sizeAvailability array with stock per size.
 */

/* ------------------------------------------------------------------ */
/*  Type definitions                                                  */
/* ------------------------------------------------------------------ */

export interface ProductVariantMediaLike {
  _id?: string;
  mediaType: "image" | "video";
  filePath?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface SizeAvailabilityLike {
  sizeId: string;
  sizeName: string;
  sizeNameMm?: string;
  sizeCategory?: string;
  stock: number;
}

export interface ProductVariantLike {
  _id: string;
  color: { id: string; name: string; hex: string; nameMm?: string };
  sizeAvailability: SizeAvailabilityLike[];
  totalStock: number;
  displayOrder: number;
  isPrimary: boolean;
  price?: number;
  media?: ProductVariantMediaLike[];
  imageUrl?: string;
  hasOwnMedia?: boolean;
}

export interface ProductColorLike {
  name: string;
  hex: string;
  stock: number;
}

export interface NormalizedVariant {
  _id: string;
  color: { id: string; name: string; hex: string; nameMm?: string };
  sizeAvailability: SizeAvailabilityLike[];
  totalStock: number;
  displayOrder: number;
  isPrimary: boolean;
  price?: number;
  media: ProductVariantMediaLike[];
  imageUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Normalize raw variant data                                        */
/* ------------------------------------------------------------------ */

export function normalizeProductVariants(
  rawVariants?: ProductVariantLike[]
): NormalizedVariant[] {
  if (!rawVariants?.length) return [];

  return rawVariants.map((variant) => ({
    _id: variant._id,
    color: variant.color,
    sizeAvailability: variant.sizeAvailability ?? [],
    totalStock: variant.totalStock ?? 0,
    displayOrder: variant.displayOrder,
    isPrimary: variant.isPrimary,
    price: variant.price,
    media: (variant.media ?? []).sort(
      (a, b) => a.displayOrder - b.displayOrder
    ),
    imageUrl: variant.imageUrl ?? "",
  }));
}

/* ------------------------------------------------------------------ */
/*  Build color option list                                           */
/* ------------------------------------------------------------------ */

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  stock: number;
}

export function buildColorOptions(
  variants: NormalizedVariant[],
  fallbackColors?: ProductColorLike[]
): ColorOption[] {
  if (variants.length === 0 && fallbackColors?.length) {
    return fallbackColors.map((color, index) => ({
      id: `legacy-${index}`,
      name: color.name,
      hex: color.hex || "#111111",
      stock: color.stock ?? 0,
    }));
  }

  // One variant = one color.
  return variants.map((variant) => ({
    id: variant.color.id,
    name: variant.color.name,
    hex: variant.color.hex,
    stock: variant.totalStock,
  }));
}

/* ------------------------------------------------------------------ */
/*  Build size options for a selected color                           */
/* ------------------------------------------------------------------ */

export function buildSizeOptionsForColor(
  variants: NormalizedVariant[],
  selectedColorId: string,
  fallbackSizes?: string[]
): string[] {
  if (variants.length === 0) {
    return fallbackSizes ?? [];
  }

  const variant = variants.find((v) => v.color.id === selectedColorId);
  if (!variant) {
    // If color not found, union all sizes from all variants.
    const allSizes = new Map<string, string>();
    for (const v of variants) {
      for (const sa of v.sizeAvailability) {
        if (!allSizes.has(sa.sizeId)) {
          allSizes.set(sa.sizeId, sa.sizeName);
        }
      }
    }
    return Array.from(allSizes.values());
  }

  return variant.sizeAvailability.map((sa) => sa.sizeName);
}

/* ------------------------------------------------------------------ */
/*  Get the variant for a selected color                              */
/* ------------------------------------------------------------------ */

export function getSelectedVariant(
  variants: NormalizedVariant[],
  selectedColorId: string,
  _selectedSize?: string
): NormalizedVariant | undefined {
  if (!variants.length) return undefined;
  return variants.find((v) => v.color.id === selectedColorId);
}

/* ------------------------------------------------------------------ */
/*  Get stock for a specific size within a variant                    */
/* ------------------------------------------------------------------ */

export function getSizeStock(
  variant: NormalizedVariant | undefined,
  sizeName: string
): number {
  if (!variant) return 0;
  const sa = variant.sizeAvailability.find(
    (s) => s.sizeName.toLowerCase() === sizeName.toLowerCase()
  );
  return sa?.stock ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Check if a specific size is in stock for a variant                */
/* ------------------------------------------------------------------ */

export function isSizeInStock(
  variant: NormalizedVariant | undefined,
  sizeName: string
): boolean {
  return getSizeStock(variant, sizeName) > 0;
}

/* ------------------------------------------------------------------ */
/*  Get display images for current selection                          */
/* ------------------------------------------------------------------ */

export function getDisplayImagesForSelection(params: {
  variants: NormalizedVariant[];
  selectedColorId: string;
  selectedSize?: string;
  productImages?: string[];
}): string[] {
  const { variants, selectedColorId, productImages = [] } = params;

  // Find the variant for the selected color.
  const selectedVariant = variants.find(
    (v) => v.color.id === selectedColorId
  );

  if (selectedVariant) {
    const variantImages = selectedVariant.media
      .filter((m) => m.mediaType === "image" && m.fileUrl)
      .map((m) => {
        const url = m.fileUrl!;
        // If it looks like a raw Convex storage ID (no slashes, typical length)
        if (url && !url.includes("/") && url.length > 10) {
          return `/api/storage/${url}`;
        }
        return url;
      })
      .filter(Boolean);

    if (variantImages.length > 0) return variantImages;
  }

  // Fallback: try primary variant images.
  const primaryVariant = variants.find((v) => v.isPrimary) || variants[0];
  if (primaryVariant) {
    const primaryImages = primaryVariant.media
      .filter((m) => m.mediaType === "image" && m.fileUrl)
      .map((m) => {
        const url = m.fileUrl!;
        if (url && !url.includes("/") && url.length > 10) {
          return `/api/storage/${url}`;
        }
        return url;
      })
      .filter(Boolean);

    if (primaryImages.length > 0) return primaryImages;
  }

  // Final fallback: product-level images.
  return productImages.filter(Boolean).map(url => {
    if (url && !url.includes("/") && url.length > 10) {
      return `/api/storage/${url}`;
    }
    return url;
  });
}
