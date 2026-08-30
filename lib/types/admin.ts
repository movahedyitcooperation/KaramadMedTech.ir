import type { Product } from "@/lib/types/product";

/** Admin-facing image/spec shapes keep the backend row `id` (needed so the
 * ImageUploader/SpecsRepeater can key React lists stably) — the public
 * ProductImage/ProductSpec types deliberately drop it, so these are
 * separate types rather than a shared one. */
export interface AdminProductImage {
  id?: number;
  url: string;
  alt: string;
}

export interface AdminProductSpec {
  id?: number;
  group: string;
  key: string;
  value: string;
}

export interface AdminProduct extends Omit<Product, "images" | "specs"> {
  images: AdminProductImage[];
  specs: AdminProductSpec[];
}

/** Plain-object form state for ProductForm — every numeric field is a
 * string while being edited (native input values), converted at the
 * Server Action boundary, not here. */
export interface ProductFormValues {
  slug: string;
  name: string;
  brand: string;
  shortDesc: string;
  description: string; // newline-joined paragraphs; split on submit
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  images: AdminProductImage[];
  specs: AdminProductSpec[];
}

export interface CategoryFormValues {
  slug: string;
  name: string;
  icon: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}
