import { CategoryIconCards } from "@/components/shop/CategoryIconCards";
import { FloatingSearchBar } from "@/components/shop/FloatingSearchBar";
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
      <FloatingSearchBar />
      <CategoryIconCards categories={categories} />
      <ProductCarousel
        kicker={fa.home.newestKicker}
        title={fa.home.newestProductsTitle}
        products={newestProducts}
        viewAllHref="/search?q="
      />
      <ServiceCards />
      <ProductCarousel
        kicker={fa.home.bestsellersKicker}
        title={fa.home.bestsellersTitle}
        products={bestsellerProducts}
        viewAllHref="/search?q="
      />
    </div>
  );
}
