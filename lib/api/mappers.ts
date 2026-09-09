import type { Address, CustomerProfile } from "@/lib/types/account";
import type {
  AdminOrder,
  AdminOrderItem,
  AdminProduct,
  AdminProductImage,
  AdminProductSpec,
  OrderStatus,
} from "@/lib/types/admin";
import type { Cart, CartLine } from "@/lib/types/cart";
import type { Order, OrderItem, OrderListResult } from "@/lib/types/order";
import type { Category } from "@/lib/types/category";
import type {
  FacetValue,
  Product,
  ProductFacets,
  ProductImage,
  ProductSpec,
} from "@/lib/types/product";
import type { ShippingSetting, SiteSettings } from "@/lib/types/settings";
import type {
  ApiAddress,
  ApiAdminOrder,
  ApiCart,
  ApiCartItem,
  ApiCategoryBase,
  ApiFacetValue,
  ApiOrder,
  ApiOrderListResult,
  ApiOrderItem,
  ApiProductFacets,
  ApiCategoryRead,
  ApiProduct,
  ApiProductImage,
  ApiProductSpec,
  ApiSiteSettings,
  ApiUser,
} from "@/lib/api/types";

const DEFAULT_BACKEND_PUBLIC_ORIGIN = "http://localhost:8000";

/**
 * Legacy seed placeholders (/images/placeholders/...) are frontend-relative
 * and resolve fine as-is against this app's own /public. Admin-uploaded
 * images are backend-relative (/api/v1/uploads/..., see
 * backend/app/main.py's static mount) and resolve against a *different*
 * origin — in prod, API_BASE_URL is a loopback address the browser can't
 * reach at all. BACKEND_PUBLIC_ORIGIN is the browser-facing backend origin,
 * server-only (not NEXT_PUBLIC_), read here and in next.config.ts.
 */
export function resolveImageUrl(url: string): string {
  if (url.startsWith("/api/v1/uploads/")) {
    const origin = (process.env.BACKEND_PUBLIC_ORIGIN ?? DEFAULT_BACKEND_PUBLIC_ORIGIN).replace(/\/+$/, "");
    return `${origin}${url}`;
  }
  return url;
}

// --- categories -----------------------------------------------------------

/**
 * parentId is passed in explicitly rather than read off `raw`: ApiCategoryBase
 * (the shape used for a category's `children` inside GET /categories/'s tree
 * response) has no parent_id field at all — only ApiCategoryRead (the
 * single-category GET /categories/{slug} endpoint) does.
 */
export function mapCategoryBase(raw: ApiCategoryBase, parentId: string | null): Category {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    icon: raw.icon ?? "", // Category.icon is a non-nullable string
    parentId,
    sortOrder: raw.sort_order,
    isActive: raw.is_active,
  };
}

export function mapCategoryRead(raw: ApiCategoryRead): Category {
  return mapCategoryBase(raw, raw.parent_id);
}

// --- products ---------------------------------------------------------------

function mapProductImage(raw: ApiProductImage): ProductImage {
  return { url: resolveImageUrl(raw.url), alt: raw.alt, sortOrder: raw.sort_order };
}

function mapProductSpec(raw: ApiProductSpec): ProductSpec {
  return { group: raw.group, key: raw.key, value: raw.value, sortOrder: raw.sort_order };
}

export function mapProduct(raw: ApiProduct): Product {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    // Product.brand/shortDesc are non-nullable strings, but the backend
    // allows null. lib/db/products.ts's searchProducts() calls
    // p.brand.toLowerCase()/p.shortDesc.toLowerCase() unconditionally — a
    // null here would throw a TypeError at runtime, not just fail a type
    // check, so this coalescing is load-bearing, not cosmetic.
    brand: raw.brand ?? "",
    shortDesc: raw.short_desc ?? "",
    description: raw.description,
    price: raw.price,
    compareAtPrice: raw.compare_at_price, // stays nullable — Product.compareAtPrice is number | null
    stock: raw.stock,
    sku: raw.sku,
    isActive: raw.is_active,
    isFeatured: raw.is_featured,
    categoryId: raw.category_id,
    ratingAvg: raw.rating_avg,
    ratingCount: raw.rating_count,
    // .map() preserves array order verbatim — do NOT re-sort here. The
    // backend already orders both via the ORM relationship's
    // order_by="...sort_order" (backend/app/models/product.py), and
    // ProductGallery.tsx/SpecTable.tsx both render "array order as
    // received" with no re-sort of their own.
    images: raw.images.map(mapProductImage),
    specs: raw.specs.map(mapProductSpec),
  };
}

function mapFacetValue(raw: ApiFacetValue): FacetValue {
  // A brand facet has no separate label — its value IS the display name.
  return { value: raw.value, label: raw.label ?? raw.value, count: raw.count };
}

export function mapFacets(raw: ApiProductFacets): ProductFacets {
  return {
    brands: raw.brands.map(mapFacetValue),
    categories: raw.categories.map(mapFacetValue),
    subcategories: raw.subcategories.map(mapFacetValue),
    inStock: raw.in_stock,
    priceMin: raw.price_min,
    priceMax: raw.price_max,
  };
}

// --- settings ---------------------------------------------------------------

function toShippingMode(mode: string): ShippingSetting["mode"] {
  // Backend's ShippingSetting.mode is untyped `str` by its own design (its
  // own comment: "tighten to Literal[...] once admin editing lands"). Guard
  // explicitly rather than blindly `as`-casting an unconstrained wire value
  // onto the frontend's "flat" | "free" union.
  return mode === "free" ? "free" : "flat";
}

export function mapSettings(raw: ApiSiteSettings): SiteSettings {
  return {
    shipping: {
      mode: toShippingMode(raw.shipping.mode),
      cost: raw.shipping.cost,
      freeOver: raw.shipping.free_over,
    },
    contact: {
      phone: raw.contact.phone,
      whatsapp: raw.contact.whatsapp,
      telegram: raw.contact.telegram,
      address: raw.contact.address,
    },
    social: {
      telegram: raw.social.telegram ?? undefined,
      instagram: raw.social.instagram ?? undefined,
      youtube: raw.social.youtube ?? undefined,
      aparat: raw.social.aparat ?? undefined,
    },
    heroSlides: raw.hero_slides.map((s) => ({
      id: s.id,
      title: s.title,
      highlight: s.highlight,
      ctaLabel: s.cta_label,
      ctaHref: s.cta_href,
      imageAlt: s.image_alt,
    })),
  };
}

// --- admin (Phase 8 — admin panel) -----------------------------------------
//
// Read-direction: admin needs the row `id` on images/specs (for stable React
// keys while reordering in ImageUploader/SpecsRepeater) that the public
// mapper above deliberately drops — so these are separate functions, not a
// shared one with an options flag.

function mapAdminProductImage(raw: ApiProductImage): AdminProductImage {
  return { id: raw.id, url: resolveImageUrl(raw.url), alt: raw.alt };
}

function mapAdminProductSpec(raw: ApiProductSpec): AdminProductSpec {
  return { id: raw.id, group: raw.group, key: raw.key, value: raw.value };
}

export function mapAdminProduct(raw: ApiProduct): AdminProduct {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    brand: raw.brand ?? "",
    shortDesc: raw.short_desc ?? "",
    description: raw.description,
    price: raw.price,
    compareAtPrice: raw.compare_at_price,
    stock: raw.stock,
    sku: raw.sku,
    isActive: raw.is_active,
    isFeatured: raw.is_featured,
    categoryId: raw.category_id,
    ratingAvg: raw.rating_avg,
    ratingCount: raw.rating_count,
    images: raw.images.map(mapAdminProductImage),
    specs: raw.specs.map(mapAdminProductSpec),
  };
}

// --- admin orders (Phase 6 checkout + admin order visibility) --------------

function mapAdminOrderItem(raw: ApiOrderItem): AdminOrderItem {
  return {
    productId: raw.product_id,
    productName: raw.product_name,
    productSku: raw.product_sku,
    unitPrice: raw.unit_price,
    qty: raw.qty,
  };
}

export function mapAdminOrder(raw: ApiAdminOrder): AdminOrder {
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    addressTitle: raw.address_title,
    addressFullName: raw.address_full_name,
    addressPhone: raw.address_phone,
    addressProvince: raw.address_province,
    addressCity: raw.address_city,
    addressLine: raw.address_line,
    addressPostalCode: raw.address_postal_code,
    subtotal: raw.subtotal,
    shippingCost: raw.shipping_cost,
    total: raw.total,
    // The backend's `status` column is a free-text string, not a DB enum
    // (see admin_orders.py's own transition table) — cast rather than
    // validate, matching ApiShippingSetting.mode's existing convention.
    status: raw.status as OrderStatus,
    items: raw.items.map(mapAdminOrderItem),
    userId: raw.user_id,
    contact: raw.contact,
    createdAt: raw.created_at,
  };
}

// Write-direction: camelCase form values -> snake_case backend payload.
// Plain objects, not imported Api* interfaces — the backend's
// ProductCreate/ProductUpdate/CategoryCreate/CategoryUpdate schemas are the
// source of truth and this is intentionally a thin, obvious 1:1 translation
// next to it, not a duplicate type hierarchy to keep in sync.

export function productFormToCreatePayload(values: {
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
  images: { url: string; alt: string }[];
  specs: { group: string; key: string; value: string }[];
}) {
  return {
    slug: values.slug,
    name: values.name,
    brand: values.brand || null,
    short_desc: values.shortDesc || null,
    description: values.description,
    price: values.price,
    compare_at_price: values.compareAtPrice,
    stock: values.stock,
    sku: values.sku,
    is_active: values.isActive,
    is_featured: values.isFeatured,
    category_id: values.categoryId,
    images: values.images.map((i) => ({ url: i.url, alt: i.alt })),
    specs: values.specs.map((s) => ({ group: s.group, key: s.key, value: s.value })),
  };
}

export function categoryFormToPayload(values: {
  slug: string;
  name: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}) {
  return {
    slug: values.slug,
    name: values.name,
    icon: values.icon || null,
    parent_id: values.parentId || null,
    sort_order: values.sortOrder,
    is_active: values.isActive,
  };
}

// --- cart -------------------------------------------------------------------

/**
 * CartItemRead.image is nullable (a product with no ProductImage rows yet) and
 * goes through resolveImageUrl for the same reason product images do: an
 * admin-uploaded /api/v1/uploads/... path resolves against the backend origin,
 * not this app's. CartLine.image is a non-nullable string, so a product
 * without an image falls back to the shared placeholder rather than rendering
 * a broken <Image src="">.
 */
const CART_IMAGE_FALLBACK = "/images/placeholders/product.svg";

function mapCartItem(raw: ApiCartItem): CartLine {
  return {
    productId: raw.product_id,
    slug: raw.slug,
    name: raw.name,
    image: raw.image ? resolveImageUrl(raw.image) : CART_IMAGE_FALLBACK,
    unitPrice: raw.unit_price,
    qty: raw.qty,
    stock: raw.stock,
  };
}

export function mapCart(raw: ApiCart): Cart {
  return { id: raw.id, items: raw.items.map(mapCartItem) };
}

// --- account ----------------------------------------------------------------

export function mapCustomerProfile(raw: ApiUser): CustomerProfile {
  return { id: raw.id, phone: raw.phone, email: raw.email, fullName: raw.full_name };
}

export function mapAddress(raw: ApiAddress): Address {
  return {
    id: raw.id,
    title: raw.title,
    fullName: raw.full_name,
    phone: raw.phone,
    province: raw.province,
    city: raw.city,
    addressLine: raw.address_line,
    postalCode: raw.postal_code,
    isDefault: raw.is_default,
  };
}

/** camelCase form values -> the backend's AddressCreate/AddressUpdate shape. */
export function addressFormToPayload(values: {
  title: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
}) {
  return {
    title: values.title,
    full_name: values.fullName,
    phone: values.phone,
    province: values.province,
    city: values.city,
    address_line: values.addressLine,
    postal_code: values.postalCode || null,
    is_default: values.isDefault,
  };
}

// --- orders -----------------------------------------------------------------

function mapOrderItem(raw: ApiOrderItem): OrderItem {
  return {
    productId: raw.product_id,
    productName: raw.product_name,
    productSku: raw.product_sku,
    unitPrice: raw.unit_price,
    qty: raw.qty,
  };
}

export function mapOrder(raw: ApiOrder): Order {
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    // Grouped into one object rather than eight flat address_* fields: the UI
    // always renders them together, and the flat shape is a wire detail.
    address: {
      title: raw.address_title,
      fullName: raw.address_full_name,
      phone: raw.address_phone,
      province: raw.address_province,
      city: raw.address_city,
      line: raw.address_line,
      postalCode: raw.address_postal_code,
    },
    subtotal: raw.subtotal,
    shippingCost: raw.shipping_cost,
    total: raw.total,
    status: raw.status,
    items: raw.items.map(mapOrderItem),
    createdAt: raw.created_at,
  };
}

export function mapOrderList(raw: ApiOrderListResult): OrderListResult {
  return {
    items: raw.items.map(mapOrder),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
  };
}
