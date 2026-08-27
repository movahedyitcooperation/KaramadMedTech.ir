"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatToman, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Product } from "@/lib/types/product";

export function ProductPurchaseCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  function onAddToCart() {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        images: product.images,
        price: product.price,
        stock: product.stock,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-sm lg:sticky lg:top-24">
      <h1 className="text-balance text-lg font-bold leading-7 text-ink-900">{product.name}</h1>
      <span className="sr-only" aria-live="polite">
        {added ? fa.product.addedToCart : ""}
      </span>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-bold text-ink-900 tabular">
          {formatToman(product.price)}
        </span>
        {product.compareAtPrice && (
          <span className="text-sm text-ink-400 line-through tabular">
            {formatToman(product.compareAtPrice)}
          </span>
        )}
        {discountPercent !== null && (
          <Badge variant="discount">{fa.product.discountBadge(toPersianDigits(discountPercent))}</Badge>
        )}
      </div>

      <p
        className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${
          inStock ? "text-green-600" : "text-ink-400"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${inStock ? "bg-green-500" : "bg-ink-400"}`}
          aria-hidden="true"
        />
        {inStock
          ? lowStock
            ? fa.product.lowStockLeft(toPersianDigits(product.stock))
            : fa.product.inStock
          : fa.product.outOfStock}
      </p>

      {inStock ? (
        <>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-ink-500">{fa.product.quantity}</span>
            <QuantityStepper value={qty} max={product.stock} onChange={setQty} />
          </div>
          <Button variant="success" size="lg" className="mt-4 w-full" onClick={onAddToCart}>
            {added ? fa.product.addedToCart : fa.product.addToCart}
          </Button>
        </>
      ) : (
        <Button variant="outline" size="lg" className="mt-4 w-full" disabled>
          {fa.product.outOfStock}
        </Button>
      )}

      <Button
        variant="outline"
        size="md"
        className="mt-3 w-full"
        disabled
        title={fa.product.compareComingSoon}
      >
        {fa.product.compare}
      </Button>
    </div>
  );
}
