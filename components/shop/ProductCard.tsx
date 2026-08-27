import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { QuickAddButton } from "@/components/shop/QuickAddButton";
import { formatToman, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock > 0;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-[box-shadow,transform] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-50">
        <Image
          src={product.images[0]?.url ?? "/images/placeholders/diagnostic-1.svg"}
          alt={product.images[0]?.alt ?? product.name}
          fill
          className="object-contain p-6 transition-transform duration-(--duration-slow) ease-out-soft group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
        {discountPercent !== null && inStock && (
          <Badge variant="discount" className="absolute end-2 top-2">
            {toPersianDigits(discountPercent)}٪−
          </Badge>
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-[1px]">
            <span className="rounded-pill bg-ink-900/80 px-3 py-1 text-xs font-medium text-white">
              {fa.product.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-sm font-medium leading-6 text-ink-700">
          <Link
            href={`/product/${product.slug}`}
            className="outline-none before:absolute before:inset-0 before:z-0 before:content-['']"
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center gap-1.5">
          <Rating value={product.ratingAvg} size={14} />
          {product.ratingCount > 0 && (
            <span className="text-xs text-ink-400 tabular">
              {fa.product.reviewsCountShort(toPersianDigits(product.ratingCount))}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-bold text-ink-900 tabular">
            {formatToman(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-ink-400 line-through tabular">
              {formatToman(product.compareAtPrice)}
            </span>
          )}
        </div>

        {inStock ? (
          <QuickAddButton
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              images: product.images,
              price: product.price,
              stock: product.stock,
            }}
          />
        ) : (
          <span className="relative z-10 mt-3 inline-flex h-9 w-full items-center justify-center rounded-input border border-line text-xs font-medium text-ink-400">
            {fa.product.outOfStock}
          </span>
        )}
      </div>
    </article>
  );
}
