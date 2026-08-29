import type { Category } from "@/lib/types/category";
import type { Product, ProductImage, ProductSpec } from "@/lib/types/product";
import type { ShippingSetting, SiteSettings } from "@/lib/types/settings";
import type {
  ApiCategoryBase,
  ApiCategoryRead,
  ApiProduct,
  ApiProductImage,
  ApiProductSpec,
  ApiSiteSettings,
} from "@/lib/api/types";

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
  return { url: raw.url, alt: raw.alt, sortOrder: raw.sort_order };
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
