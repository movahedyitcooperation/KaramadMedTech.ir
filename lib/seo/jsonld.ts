import type { Product } from "@/lib/types/product";

export function buildProductJsonLd(product: Product, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) => img.url),
    description: product.shortDesc,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "IRR",
      // stored price is in Toman (CLAUDE.md); schema.org/ISO 4217 expects Rial.
      price: product.price * 10,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://karamadmedtech.ir";

export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/+$/, "")}${path}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "تجهیزات پزشکی کارآمد",
    url: SITE_URL,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "تجهیزات پزشکی کارآمد",
    url: SITE_URL,
    inLanguage: "fa-IR",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
