"use client";

import { Check, ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Product } from "@/lib/types/product";
import { cn } from "@/lib/utils/cn";

type QuickAddProduct = Pick<
  Product,
  "id" | "slug" | "name" | "images" | "price" | "stock"
>;

/**
 * Compact add-to-cart control for the product card. Always visible (no
 * hover-only affordance) and self-contained so ProductCard can stay a
 * server component.
 */
export function QuickAddButton({
  product,
  className,
}: {
  product: QuickAddProduct;
  className?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onClick() {
    addItem(product, 1);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative z-10 mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-input border text-xs font-medium transition-[color,background-color,border-color,transform] duration-(--duration-fast) ease-out-soft active:scale-[0.98]",
        added
          ? "border-green-500 bg-green-500/10 text-green-600"
          : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
        className
      )}
    >
      {added ? (
        <>
          <Check size={15} weight="bold" aria-hidden="true" className="animate-check-pop" />
          {fa.product.addedToCart}
        </>
      ) : (
        <>
          <ShoppingCartSimple size={15} aria-hidden="true" />
          {fa.product.quickAdd}
        </>
      )}
    </button>
  );
}
