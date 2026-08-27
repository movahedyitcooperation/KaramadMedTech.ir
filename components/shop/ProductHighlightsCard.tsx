import { Heart, Phone } from "@phosphor-icons/react/dist/ssr";
import { Rating } from "@/components/ui/Rating";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";

export function ProductHighlightsCard({ product, phone }: { product: Product; phone: string }) {
  const topSpecs = product.specs.slice(0, 4);

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Rating value={product.ratingAvg} />
        <span className="text-sm text-ink-500">
          {product.ratingCount > 0
            ? fa.product.ratingLabel(
                toPersianDigits(product.ratingAvg),
                toPersianDigits(product.ratingCount)
              )
            : fa.product.noRatingYet}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        <span className="text-ink-500">{fa.product.brand}</span>
        <span className="font-medium text-ink-900" translate="no">
          {product.brand}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 text-sm">
        <span className="text-ink-500">{fa.product.sku}</span>
        <span className="font-medium tabular-nums text-ink-900" translate="no">
          {product.sku}
        </span>
      </div>

      {topSpecs.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {topSpecs.map((spec, i) => (
            <li key={i} className="flex items-center justify-between gap-4">
              <span className="text-ink-500">{spec.key}</span>
              <span className="font-medium text-ink-900">{spec.value}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2 border-t border-line pt-4">
        <a
          href={`tel:${phone}`}
          className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-pill bg-coral-500 text-sm font-medium text-white transition-colors duration-200 hover:bg-coral-600"
        >
          <Phone size={18} aria-hidden="true" />
          {fa.product.consult}
        </a>
        <button
          type="button"
          disabled
          title={fa.product.save}
          aria-label={fa.product.save}
          className="flex h-11 w-11 items-center justify-center rounded-pill border border-line text-ink-500 disabled:opacity-50"
        >
          <Heart size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
