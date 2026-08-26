"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Product } from "@/lib/types/product";

export function ProductPurchaseCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inStock = product.stock > 0;

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
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <p className="text-sm text-ink-500">{product.name}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-bold text-ink-900">{formatToman(product.price)}</span>
        {product.compareAtPrice && (
          <span className="text-sm text-ink-500 line-through">
            {formatToman(product.compareAtPrice)}
          </span>
        )}
      </div>

      {inStock ? (
        <>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-ink-500">{fa.product.quantity}</span>
            <QuantityStepper value={qty} max={product.stock} onChange={setQty} />
          </div>
          <Button variant="teal" size="lg" className="mt-4 w-full" onClick={onAddToCart}>
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
