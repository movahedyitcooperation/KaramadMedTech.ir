/* seo.js — per-route <title>, meta description, canonical, and JSON-LD.
   Structured data: Organization + WebSite always; Product + BreadcrumbList on
   the PDP; BreadcrumbList on the category page (master prompt §12). */

import fa from "../i18n/fa.js";

const SITE = "https://karamadmedtech.ir";

function setMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setOG(prop, content) {
  let el = document.head.querySelector(`meta[property="${prop}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
  el.setAttribute("href", href);
}
function setJsonLd(objects) {
  document.querySelectorAll('script[data-seo-jsonld]').forEach((n) => n.remove());
  for (const obj of objects) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-seo-jsonld", "");
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }
}

const orgLd = () => ({
  "@context": "https://schema.org", "@type": "Organization",
  name: "تجهیزات پزشکی کارآمد", url: SITE,
});
const siteLd = () => ({
  "@context": "https://schema.org", "@type": "WebSite",
  name: "تجهیزات پزشکی کارآمد", url: SITE, inLanguage: "fa-IR",
});

export function applySeo(state) {
  const s = state;
  const canonical = SITE + "/" + location.hash;
  let title = fa.meta.homeTitle;
  let desc = fa.meta.homeDesc;
  const ld = [orgLd(), siteLd()];

  if (s.route === "category") {
    const cat = s.categories.find((c) => c.slug === s.catSlug) ||
      s.categories.find((c) => (c.children || []).some((ch) => ch.slug === s.catSlug));
    const sub = cat && ((cat.children || []).find((c) => c.slug === s.subSlug) || (cat.children || []).find((c) => c.slug === s.catSlug));
    const name = sub ? sub.name : cat ? cat.name : "";
    if (name) { title = fa.meta.categoryTitle(name); desc = name + " — " + fa.meta.homeDesc; }
    if (cat) ld.push(breadcrumbLd([{ name: fa.category.home, url: SITE }, { name: name, url: canonical }]));
  } else if (s.route === "product" && s.product) {
    const p = s.product;
    title = fa.meta.productTitle(p.name);
    desc = p.short_desc || (p.description && p.description[0]) || fa.meta.homeDesc;
    const cat = s.categories.find((c) => c.id === p.category_id);
    ld.push(productLd(p, cat));
    ld.push(breadcrumbLd([
      { name: fa.pdp.home, url: SITE },
      cat && { name: cat.name, url: SITE + "/#/c/" + cat.slug },
      { name: p.name, url: canonical },
    ].filter(Boolean)));
  } else if (s.route === "cart") {
    title = fa.meta.cartTitle;
  } else if (s.route === "login") {
    title = fa.meta.loginTitle;
  } else if (s.route === "account") {
    title = fa.meta.accountTitle;
  }

  document.title = title;
  setMeta("description", desc);
  setOG("og:title", title);
  setOG("og:description", desc);
  setOG("og:type", s.route === "product" ? "product" : "website");
  setOG("og:site_name", "تجهیزات پزشکی کارآمد");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", desc);
  setCanonical(canonical);
  setJsonLd(ld);
}

function productLd(p, cat) {
  const onSale = p.compare_at_price && p.compare_at_price > p.price;
  return {
    "@context": "https://schema.org", "@type": "Product",
    name: p.name, sku: p.sku, brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    description: p.short_desc || (p.description && p.description[0]) || undefined,
    category: cat ? cat.name : undefined,
    image: p.images && p.images[0] ? p.images[0].url : undefined,
    aggregateRating: p.rating_count ? { "@type": "AggregateRating", ratingValue: p.rating_avg, reviewCount: p.rating_count } : undefined,
    offers: {
      "@type": "Offer", price: p.price, priceCurrency: "IRT",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(onSale ? { priceSpecification: { "@type": "PriceSpecification", price: p.price, priceCurrency: "IRT" } } : {}),
    },
  };
}

function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}
