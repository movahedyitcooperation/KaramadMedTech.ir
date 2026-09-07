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

export interface ApiFacetValue {
  value: string;
  /** Present where `value` is a machine key (a category slug); null for a
   * brand, whose value is already its label. */
  label: string | null;
  count: number;
}

/** Only present when the request passed `include_facets=true`. */
export interface ApiProductFacets {
  brands: ApiFacetValue[];
  categories: ApiFacetValue[];
  subcategories: ApiFacetValue[];
  in_stock: number;
  price_min: number | null;
  price_max: number | null;
}

/** GET /products/ returns this. */
export interface ApiProductListResult {
  items: ApiProduct[];
  total: number;
  page: number;
  page_size: number;
  /** Null unless the request passed `include_facets=true`. */
  facets: ApiProductFacets | null;
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

// --- cart (backend/app/schemas/cart.py) -------------------------------------
//
// Note what CartRead does NOT carry: no price snapshot and no totals.
// `unit_price` is joined fresh from the product row on every read, so subtotal
// / shipping / total are always recomputed by the caller from the latest
// response plus GET /settings/'s shipping rule — never cached client-side.

export interface ApiCartItem {
  product_id: string;
  slug: string;
  name: string;
  image: string | null;
  unit_price: number;
  qty: number;
  stock: number;
}

export interface ApiCart {
  id: string;
  items: ApiCartItem[];
}

// --- customer auth (backend/app/schemas/customer_auth.py) -------------------

export interface ApiRequestOtpResponse {
  contact: string;
  channel: "phone" | "email";
  expires_in: number;
}

export interface ApiVerifyOtpResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  contact: string;
  cart: ApiCart;
}

// --- account (backend/app/schemas/account.py) -------------------------------

export interface ApiUser {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
}

export interface ApiAddress {
  id: string;
  title: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address_line: string;
  postal_code: string | null;
  is_default: boolean;
}

// --- orders (backend/app/schemas/order.py) ----------------------------------
//
// Admin-scoped for now. The customer-facing GET /orders/ endpoints exist on
// the backend too, but the account's سفارش‌ها tab isn't wired to them yet —
// still the designed empty state docs/BACKEND-GAPS.md describes.

export interface ApiOrderItem {
  product_id: string | null;
  product_name: string;
  product_sku: string;
  unit_price: number;
  qty: number;
}

export interface ApiAdminOrder {
  id: string;
  order_number: string;
  address_title: string;
  address_full_name: string;
  address_phone: string;
  address_province: string;
  address_city: string;
  address_line: string;
  address_postal_code: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  items: ApiOrderItem[];
  user_id: string;
  contact: string;
  created_at: string;
}

/** GET /admin/orders/ returns this. */
export interface ApiAdminOrderListResult {
  items: ApiAdminOrder[];
  total: number;
  page: number;
  page_size: number;
}
