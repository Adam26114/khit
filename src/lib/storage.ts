import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface UploadResult {
  storageId: string;
  url: string;
}

export function useImageUpload() {
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const uploadImage = async (file: File): Promise<UploadResult> => {
    const processedFile = await compressImageToWebP(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
    });

    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl();

    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": processedFile.type },
      body: processedFile,
    });

    if (!result.ok) {
      throw new Error("Failed to upload image");
    }

    const { storageId } = await result.json();

    // Step 3: Get the URL for the uploaded file
    // Note: In a real app, you might want to store the URL or generate it on demand
    return {
      storageId,
      url: `/api/storage/${storageId}`, // This would need a corresponding API route
    };
  };

  return { uploadImage };
}

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const { width, height } = getTargetDimensions(
      image.naturalWidth,
      image.naturalHeight,
      maxWidth,
      maxHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not process image.");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    if (!blob) {
      throw new Error("Could not convert image to WebP.");
    }
    if (blob.type !== "image/webp") {
      throw new Error("WebP conversion is not supported in this browser.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Invalid image file."));
    img.src = src;
  });
}

function getTargetDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

// Helper to validate image files
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

// Helper to get image URL from storage ID
export function getImageUrl(storageId: string): string {
  // This assumes you have a Convex storage URL pattern
  // The actual URL format depends on your Convex deployment
  return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;
}
