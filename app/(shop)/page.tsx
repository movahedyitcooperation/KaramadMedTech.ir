import { CategoryIconCards } from "@/components/shop/CategoryIconCards";
import { HeroSlider } from "@/components/shop/HeroSlider";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { ServiceCards } from "@/components/shop/ServiceCards";
import { getTopLevelCategories } from "@/lib/db/categories";
import { getBestsellerProducts, getNewestProducts } from "@/lib/db/products";
import { getSiteSettings } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";

export default async function HomePage() {
  const [settings, categories, newestProducts, bestsellerProducts] = await Promise.all([
    getSiteSettings(),
    getTopLevelCategories(),
    getNewestProducts(8),
    getBestsellerProducts(8),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <HeroSlider slides={settings.heroSlides} />
      </div>
      {/* The finder card (Stage 4) replaces this — home temporarily has no
       * search/finder affordance between Stage 2 and Stage 4. */}
      <CategoryIconCards categories={categories} />
      <ProductCarousel
        title={fa.home.newestProductsTitle}
        products={newestProducts}
        viewAllHref="/search?q="
      />
      <ServiceCards />
      <ProductCarousel
        title={fa.home.bestsellersTitle}
        products={bestsellerProducts}
        viewAllHref="/search?q="
      />
    </div>
  );
}
