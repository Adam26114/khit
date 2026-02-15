export function resolveImageSrc(src?: string | null): string {
  if (!src) return "";

  if (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  if (src.startsWith("api/storage/")) {
    return `/${src}`;
  }

  // Raw Convex storage ID -> serve through local proxy route.
  return `/api/storage/${src}`;
}
