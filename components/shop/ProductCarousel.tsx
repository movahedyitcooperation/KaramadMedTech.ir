"use client";

import { ProductCard } from "@/components/shop/ProductCard";
import { Carousel } from "@/components/ui/Carousel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Product } from "@/lib/types/product";

interface ProductCarouselProps {
  title: string;
  kicker?: string;
  products: Product[];
  viewAllHref?: string;
}

export function ProductCarousel({ title, kicker, products, viewAllHref }: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader kicker={kicker} title={title} viewAllHref={viewAllHref} />
      <Carousel
        ariaLabel={title}
        slides={products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        slidesPerView={{ base: 1, sm: 2, md: 3, lg: 4 }}
        slideClassName="px-2"
      />
    </section>
  );
}
