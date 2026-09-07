import Link from "next/link";
import type { Metadata } from "next";
import { CategoryIconCards } from "@/components/shop/CategoryIconCards";
import { HeroSlider } from "@/components/shop/HeroSlider";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { ServiceCards } from "@/components/shop/ServiceCards";
import { TrustBadges } from "@/components/shop/TrustBadges";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { getTopLevelCategories } from "@/lib/db/categories";
import { getFeaturedProducts, getNewestProducts, listProducts } from "@/lib/db/products";
import { getSiteSettings } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";

export const metadata: Metadata = {
  title: fa.meta.homeTitle,
  description: fa.meta.homeDesc,
  openGraph: {
    title: fa.meta.homeTitle,
    description: fa.meta.homeDesc,
    type: "website",
    siteName: fa.brand.fullName,
  },
};

export default async function HomePage() {
  const [settings, categories, newest, featured, facetSource] = await Promise.all([
    getSiteSettings(),
    getTopLevelCategories(),
    getNewestProducts(8),
    getFeaturedProducts(8),
    // One request returns every department's product count as a facet. This
    // used to be one COUNT per department — an N+1 that would grow with the
    // category tree. page_size=1 because only the facets are read.
    listProducts(null, { pageSize: 1, includeFacets: true }),
  ]);

  const countBySlug = new Map(
    (facetSource.facets?.categories ?? []).map((c) => [c.value, c.count])
  );
  const railItems = categories.map((category) => ({
    category,
    productCount: countBySlug.get(category.slug) ?? 0,
  }));

  const clinicCategory = categories.find((c) => c.slug === "tajhizat-matb-clinic") ?? null;

  return (
    <ScreenTransition screenKey="home">
      <HeroSlider slides={settings.heroSlides} />
      <CategoryIconCards items={railItems} />

      <ProductCarousel
        title={fa.home.newestHeading}
        ariaLabel={fa.home.newestAria}
        products={newest}
        action={
          categories[0] ? (
            <Link
              href={`/category/${categories[0].slug}`}
              className="rounded-pill border border-ink/18 px-4.5 py-2.5 text-sm text-ink transition-colors duration-(--duration-state) hover:border-ink"
            >
              {fa.home.allProducts}
            </Link>
          ) : null
        }
      />

      <ServiceCards contact={settings.contact} clinicCategorySlug={clinicCategory?.slug ?? null} />

      <ProductCarousel
        title={fa.home.featuredHeading}
        ariaLabel={fa.home.featuredAria}
        products={featured}
        variant="featured"
        action={<span className="text-13 leading-[1.7] text-ink/70">{fa.home.featuredNote}</span>}
      />

      <TrustBadges />
    </ScreenTransition>
  );
}
