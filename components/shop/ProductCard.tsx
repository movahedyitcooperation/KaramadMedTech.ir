import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock > 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-shadow duration-200 hover:shadow-soft-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-50">
        <Image
          src={product.images[0]?.url ?? "/images/placeholders/diagnostic-1.svg"}
          alt={product.images[0]?.alt ?? product.name}
          fill
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
        {!inStock && (
          <Badge variant="danger" className="absolute start-2 top-2">
            {fa.product.outOfStock}
          </Badge>
        )}
        {inStock && product.compareAtPrice && (
          <Badge variant="coral" className="absolute start-2 top-2">
            تخفیف
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-sm font-medium text-ink-900">{product.name}</p>
        <Rating value={product.ratingAvg} size={14} />
        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-bold text-ink-900">{formatToman(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-ink-500 line-through">
              {formatToman(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
