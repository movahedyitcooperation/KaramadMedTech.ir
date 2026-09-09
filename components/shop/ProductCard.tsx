import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { RatingRow } from "@/components/shop/RatingRow";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";
import { cn } from "@/lib/utils/cn";

// Deliberately neutral: a placeholder must not depict a product it is not.
// Keying this off the department would mean threading the category tree
// through every card, and a rehab placeholder is still a placeholder.
const IMAGE_FALLBACK = "/images/placeholders/product.svg";

export type ProductCardVariant = "full" | "featured" | "mini";

/**
 * The product card — its own component, not a `<Card>` variant.
 *
 * Hairline border, full-bleed photo, no shadow and no image zoom: the border
 * darkening on hover IS the affordance (CLAUDE.md §3). Only ink/danger/warn
 * appear here — never a department color, because this is the shopping
 * surface.
 *
 * Three variants:
 *  - "full"     home جدیدترین + the category grid: out-of-stock badge,
 *               discount tag, low-stock line, add-to-cart.
 *  - "featured" home پرفروش‌ترین: no badge, no discount, price only.
 *  - "mini"     PDP محصولات جانبی: 4:3 image, name + price, no CTA.
 *
 * On "two audiences, one card": a ۹۵٬۰۰۰-toman item and an ۸۹-million-toman
 * item use the identical treatment. There is deliberately no premium tier.
 */
export function ProductCard({
  product,
  variant = "full",
}: {
  product: Product;
  variant?: ProductCardVariant;
}) {
  const image = product.images[0];
  const href = `/product/${product.slug}`;
  const outOfStock = product.stock === 0;
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discount = onSale
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;
  const lowStock = product.stock > 0 && product.stock <= 3;

  const shell = "flex h-full flex-col overflow-hidden rounded-3 border border-ink/9 bg-surface";

  if (variant === "mini") {
    return (
      <article className={shell}>
        <Link href={href} aria-label={product.name} className="j-zoom block">
          <Image
            src={image?.url ?? IMAGE_FALLBACK}
            alt={product.name}
            width={800}
            height={600}
            loading="lazy"
            className="block aspect-[4/3] w-full bg-img-bg object-cover"
            sizes="(min-width: 1024px) 232px, 60vw"
          />
        </Link>
        <div className="flex flex-1 flex-col gap-2.5 p-3.5">
          <Link
            href={href}
            className="j-line-clamp-2 min-h-[51px] text-start text-14 leading-[1.75] text-ink transition-colors duration-(--duration-state) hover:text-emerald-live"
          >
            {product.name}
          </Link>
          <strong className="text-lg font-extrabold">{formatToman(product.price)}</strong>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(shell, "transition-colors duration-(--duration-state) ease-out hover:border-ink/30")}
    >
      <Link href={href} aria-label={product.name} className="relative block">
        <Image
          src={image?.url ?? IMAGE_FALLBACK}
          alt={product.name}
          width={600}
          height={600}
          loading="lazy"
          className="block aspect-square w-full bg-img-bg object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 80vw"
        />
        {/* Only the exception earns a badge on the scan surface — in-stock is
         * the unmarked default, since an enabled add button already says it. */}
        {variant === "full" && outOfStock && (
          <span className="absolute start-3 top-3 rounded-2 bg-ink/72 px-2.5 py-1 text-12 font-bold text-surface">
            {fa.card.outOfStock}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex min-h-5 items-center gap-2">
          <span dir="ltr" className="text-12 font-semibold tracking-[0.02em] text-ink/68">
            {product.brand}
          </span>
          {variant === "full" && onSale && (
            <span className="rounded-2 bg-danger px-2 py-0.5 text-12 font-bold text-surface">
              {fa.card.discountShort(discount)}
            </span>
          )}
        </div>

        {/* A real heading, so a screen-reader user can skim a shelf by
          * product name — a grid of 9 cards used to contribute nothing at
          * all to the document outline. Weight and size are unchanged. */}
        <h3 className="m-0 text-15 leading-[1.75] font-normal">
          <Link
            href={href}
            className="j-line-clamp-2 block min-h-[52.5px] text-start text-ink transition-colors duration-(--duration-state) hover:text-emerald-live"
          >
            {product.name}
          </Link>
        </h3>

        <RatingRow value={product.ratingAvg} />

        {variant === "featured" ? (
          <strong className="text-lg font-extrabold">{formatToman(product.price)}</strong>
        ) : (
          <div className="flex flex-wrap items-baseline gap-2.5">
            {onSale && (
              <span className="text-13 text-ink/65 line-through">
                {formatToman(product.compareAtPrice as number)}
              </span>
            )}
            <strong className="text-lg font-extrabold">{formatToman(product.price)}</strong>
          </div>
        )}

        {/* The low-stock note sits ABOVE the CTA so `mt-auto` still pins the
         * button to the card's base — every CTA in a carousel row lines up. */}
        {variant === "full" && lowStock && (
          <div className="mt-auto text-12 leading-relaxed text-warn">
            {fa.card.lowStock(product.stock)}
          </div>
        )}

        {outOfStock ? (
          <Link
            href={href}
            className={cn(
              "rounded-4 border border-ink/18 py-3 text-center text-14 font-semibold text-ink transition-colors duration-(--duration-state) hover:border-ink",
              variant === "full" && lowStock ? "mt-0" : "mt-auto"
            )}
          >
            {fa.card.notify}
          </Link>
        ) : (
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            stock={product.stock}
            className={variant === "full" && lowStock ? "mt-0" : "mt-auto"}
          />
        )}
      </div>
    </article>
  );
}
