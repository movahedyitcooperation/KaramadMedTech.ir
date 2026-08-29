// Raw snake_case shapes returned by the FastAPI backend (backend/app/schemas/*.py).
// These mirror the Pydantic response models field-for-field — never imported
// outside lib/api/ and lib/db/*.ts. See lib/api/mappers.ts for the
// snake_case -> camelCase conversion into the frontend's own lib/types/*.ts.

export interface ApiCategoryBase {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ApiCategoryRead extends ApiCategoryBase {
  parent_id: string | null;
}

/** GET /categories/ returns this — one level of children only. */
export interface ApiCategoryTree extends ApiCategoryBase {
  children: ApiCategoryBase[];
}

export interface ApiProductImage {
  id: number;
  url: string;
  alt: string;
  sort_order: number;
}

export interface ApiProductSpec {
  id: number;
  group: string;
  key: string;
  value: string;
  sort_order: number;
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  short_desc: string | null;
  description: string[];
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  category_id: string;
  rating_avg: number;
  rating_count: number;
  images: ApiProductImage[];
  specs: ApiProductSpec[];
}

/** GET /products/ returns this. */
export interface ApiProductListResult {
  items: ApiProduct[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiShippingSetting {
  mode: string; // untyped free text on the backend for now, not yet a Literal
  cost: number;
  free_over: number;
}

export interface ApiContactSetting {
  phone: string;
  whatsapp: string;
  telegram: string;
  address: string;
}

export interface ApiSocialLinks {
  telegram?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  aparat?: string | null;
}

export interface ApiHeroSlide {
  id: string;
  title: string;
  highlight: string;
  cta_label: string;
  cta_href: string;
  image_alt: string;
}

/** GET /settings/ returns this. */
export interface ApiSiteSettings {
  shipping: ApiShippingSetting;
  contact: ApiContactSetting;
  social: ApiSocialLinks;
  hero_slides: ApiHeroSlide[];
}
