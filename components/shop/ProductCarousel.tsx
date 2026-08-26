"use client";

import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { Carousel } from "@/components/ui/Carousel";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";

interface ProductCarouselProps {
  title: string;
  products: Product[];
  viewAllHref?: string;
}

export function ProductCarousel({ title, products, viewAllHref }: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <span className="h-4 w-1 rounded-full bg-coral-500" aria-hidden="true" />
          {title}
        </h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-brand-600 hover:underline">
            {fa.common.viewAll}
          </Link>
        )}
      </div>
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
