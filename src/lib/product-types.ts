export type Size = "S" | "M" | "L" | "XL" | "FREE SIZE";

export const ALL_SIZES: Size[] = [
  "S",
  "M",
  "L",
  "XL",
  "FREE SIZE",
];

export function getSizeDisplayName(size: string): string {
  if (size.toUpperCase() === "FREE SIZE") return "F";
  return size;
}

export type MeasurementField = "shoulder" | "chest" | "sleeve" | "waist" | "length";

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  "shoulder",
  "chest",
  "sleeve",
  "waist",
  "length",
];

export interface SizeMeasurements {
  shoulder?: number;
  chest?: number;
  sleeve?: number;
  waist?: number;
  length?: number;
}

export interface ImageFile {
  id: string;
  file?: File;
  preview: string;
  label: string;
  storageId?: string;
}

export interface ColorVariant {
  id: string;
  colorName: string;
  colorHex: string;
  images: ImageFile[];
  selectedSizes: Size[];
  stock: Partial<Record<Size, number>>;
  measurements: Partial<Record<Size, SizeMeasurements>>;
}

export const DEFAULT_CATEGORIES = [
  "T-Shirts",
  "Polo Shirts",
  "Casual Shirts",
  "Jeans",
  "Trousers",
  "Shorts",
  "Jackets",
  "Hoodies",
  "Sweaters",
  "Dresses",
  "Skirts",
  "Activewear",
  "Underwear",
  "Socks",
  "Accessories",
];

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 10) / 10;
}

export function createEmptyColorVariant(): ColorVariant {
  return {
    id: crypto.randomUUID(),
    colorName: "",
    colorHex: "#111111",
    images: [],
    selectedSizes: [],
    stock: {},
    measurements: {},
  };
}
