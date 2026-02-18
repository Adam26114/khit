import { resolveImageSrc } from "@/lib/image";

export interface ProductColorLike {
  name: string;
  hex: string;
  stock: number;
}

export interface ProductVariantMediaLike {
  mediaType: "image" | "video";
  filePath: string;
  fileUrl?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface ProductVariantLike {
  _id: string;
  color: {
    id: string;
    name: string;
    hex: string;
  };
  size: {
    id: string;
    name: string;
  };
  stock: number;
  displayOrder: number;
  isPrimary: boolean;
  price?: number;
  media?: ProductVariantMediaLike[];
  imageUrl?: string;
}

export interface ProductColorOption {
  id: string;
  name: string;
  hex: string;
  stock: number;
  order: number;
}

const DEFAULT_COLOR_HEX = "#111111";

function isRenderableImagePath(src: string): boolean {
  if (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("api/storage/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return true;
  }

  return /^[a-z0-9]{20,}$/.test(src);
}

function uniqueImages(images: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const image of images) {
    if (!image || seen.has(image)) continue;
    seen.add(image);
    result.push(image);
  }

  return result;
}

function toResolvedImage(src?: string | null): string {
  if (!src) return "";
  if (!isRenderableImagePath(src)) return "";
  return resolveImageSrc(src);
}

function getVariantImages(variant: ProductVariantLike | null): string[] {
  if (!variant) return [];

  const fromMedia = (variant.media ?? [])
    .filter((media) => media.mediaType === "image")
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((media) => toResolvedImage(media.fileUrl) || toResolvedImage(media.filePath))
    .filter(Boolean);

  if (fromMedia.length > 0) {
    return uniqueImages(fromMedia);
  }

  const fallback = toResolvedImage(variant.imageUrl);
  return fallback ? [fallback] : [];
}

export function normalizeProductVariants(
  variants?: ProductVariantLike[] | null
): ProductVariantLike[] {
  return (variants ?? [])
    .filter(Boolean)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function buildColorOptions(
  variants?: ProductVariantLike[] | null,
  legacyColors: ProductColorLike[] = []
): ProductColorOption[] {
  const normalizedVariants = normalizeProductVariants(variants);

  if (normalizedVariants.length === 0) {
    return legacyColors.map((color, index) => ({
      id: `legacy:${color.name.toLowerCase()}`,
      name: color.name,
      hex: color.hex || DEFAULT_COLOR_HEX,
      stock: Math.max(0, Number(color.stock) || 0),
      order: index,
    }));
  }

  const colorMap = new Map<string, ProductColorOption>();

  for (const variant of normalizedVariants) {
    const colorId = String(variant.color.id);
    const existing = colorMap.get(colorId);

    if (!existing) {
      colorMap.set(colorId, {
        id: colorId,
        name: variant.color.name,
        hex: variant.color.hex || DEFAULT_COLOR_HEX,
        stock: Math.max(0, Number(variant.stock) || 0),
        order: variant.displayOrder,
      });
      continue;
    }

    existing.stock += Math.max(0, Number(variant.stock) || 0);
    existing.order = Math.min(existing.order, variant.displayOrder);
  }

  return Array.from(colorMap.values()).sort((a, b) => a.order - b.order);
}

export function buildSizeOptionsForColor(
  variants: ProductVariantLike[] | null | undefined,
  selectedColorId: string,
  legacySizes: string[] = []
): string[] {
  const normalizedVariants = normalizeProductVariants(variants);

  if (normalizedVariants.length === 0) {
    return legacySizes;
  }

  const filteredVariants = selectedColorId
    ? normalizedVariants.filter((variant) => String(variant.color.id) === selectedColorId)
    : normalizedVariants;

  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const variant of filteredVariants) {
    const sizeName = variant.size.name;
    if (seen.has(sizeName)) continue;
    seen.add(sizeName);
    sizes.push(sizeName);
  }

  return sizes;
}

export function getSelectedVariant(
  variants: ProductVariantLike[] | null | undefined,
  selectedColorId: string,
  selectedSize: string
): ProductVariantLike | null {
  const normalizedVariants = normalizeProductVariants(variants);
  if (normalizedVariants.length === 0) return null;

  const primaryVariant =
    normalizedVariants.find((variant) => variant.isPrimary) ?? normalizedVariants[0];

  const variantsForColor = selectedColorId
    ? normalizedVariants.filter((variant) => String(variant.color.id) === selectedColorId)
    : normalizedVariants;

  if (variantsForColor.length === 0) {
    return primaryVariant;
  }

  if (selectedSize) {
    const exact = variantsForColor.find((variant) => variant.size.name === selectedSize);
    if (exact) return exact;
  }

  return variantsForColor.find((variant) => variant.isPrimary) ?? variantsForColor[0];
}

export function getDisplayImagesForSelection(params: {
  variants?: ProductVariantLike[] | null;
  selectedColorId: string;
  selectedSize: string;
  productImages?: string[] | null;
}): string[] {
  const normalizedVariants = normalizeProductVariants(params.variants);
  const fallbackProductImages = uniqueImages(
    (params.productImages ?? [])
      .map((image) => toResolvedImage(image))
      .filter(Boolean)
  );

  if (normalizedVariants.length === 0) {
    return fallbackProductImages;
  }

  const selectedVariant = getSelectedVariant(
    normalizedVariants,
    params.selectedColorId,
    params.selectedSize
  );

  const images: string[] = [];

  const addVariantImages = (variant: ProductVariantLike | null) => {
    for (const image of getVariantImages(variant)) {
      if (!images.includes(image)) {
        images.push(image);
      }
    }
  };

  if (selectedVariant) {
    addVariantImages(selectedVariant);

    const sameColorVariants = normalizedVariants.filter(
      (variant) =>
        String(variant.color.id) === String(selectedVariant.color.id) &&
        variant._id !== selectedVariant._id
    );
    for (const variant of sameColorVariants) {
      addVariantImages(variant);
    }
  }

  if (images.length === 0) {
    const primaryVariant =
      normalizedVariants.find((variant) => variant.isPrimary) ?? normalizedVariants[0];
    addVariantImages(primaryVariant);
    for (const variant of normalizedVariants) {
      if (variant._id === primaryVariant._id) continue;
      addVariantImages(variant);
      if (images.length > 0) break;
    }
  }

  if (images.length === 0) {
    images.push(...fallbackProductImages);
  }

  return uniqueImages(images);
}
