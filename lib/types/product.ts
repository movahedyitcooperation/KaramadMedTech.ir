export interface ProductImage {
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductSpec {
  group: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  shortDesc: string;
  description: string[];
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  ratingAvg: number;
  ratingCount: number;
  images: ProductImage[];
  specs: ProductSpec[];
}

export interface FacetValue {
  /** Machine key: a brand name, or a category slug. */
  value: string;
  /** Display name. Equal to `value` for brands, the category name for slugs. */
  label: string;
  count: number;
}

/**
 * Counts for the filters the storefront offers, over the same filtered set as
 * the products themselves — computed by Postgres in the same request, never
 * by counting rows in the browser.
 *
 * Each facet is counted with every *other* active filter applied but not its
 * own, so "Omron (2)" still appears next to "Beurer (1)" after Omron is
 * checked. Requested per call, since the carousels never need it.
 */
export interface ProductFacets {
  brands: FacetValue[];
  /** Top-level departments, with sub-category hits folded into the parent. */
  categories: FacetValue[];
  /** Children of the selected department; empty when none is selected. */
  subcategories: FacetValue[];
  inStock: number;
  priceMin: number | null;
  priceMax: number | null;
}
