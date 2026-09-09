import type { ReactNode } from "react";
import { ProductCard, type ProductCardVariant } from "@/components/shop/ProductCard";
import type { Product } from "@/lib/types/product";

interface ProductCarouselProps {
  title: string;
  ariaLabel: string;
  products: Product[];
  variant?: ProductCardVariant;
  /** Rendered on the heading's end edge — a link, or a line of context. */
  action?: ReactNode;
}

/**
 * A scroll-snap row, not a JS carousel: no arrows, no autoplay, no library.
 * On a touch device it's a native swipe; on a desktop it's a thin scrollbar.
 *
 * `display: grid` on each item lets the card fill the grid-stretched wrapper,
 * so every card in the row is the same height and their CTAs line up.
 * `.km-stagger` settles the cards in once, the moment their data lands.
 */
export function ProductCarousel({
  title,
  ariaLabel,
  products,
  variant = "full",
  action,
}: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section aria-label={ariaLabel} className="mx-auto max-w-[1280px] px-5 pt-16 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-5">
        <h2 className="text-h2 font-extrabold tracking-[-0.01em]">{title}</h2>
        {action}
      </div>
      <div className="km-scroll km-stagger relative grid snap-x snap-mandatory grid-flow-col auto-cols-[minmax(246px,1fr)] gap-4.5 overflow-x-auto pb-2.5">
        {products.map((p) => (
          <div key={p.id} className="grid snap-start">
            <ProductCard product={p} variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
}
