"use client";

import { ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { formatToman, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils/cn";

export function CartDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = useCartStore((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={fa.header.cartButton}
        className="relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill bg-green-500 px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-600"
      >
        <ShoppingCart size={20} aria-hidden="true" />
        <span className="hidden sm:inline" aria-hidden="true">
          {fa.header.cartButton}
        </span>
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -end-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white"
          >
            {toPersianDigits(count)}
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {count > 0 ? fa.header.cartItemCount(toPersianDigits(count)) : fa.header.cartEmpty}
      </span>

      {open && (
        <div
          role="dialog"
          aria-label={fa.cart.dropdownTitle}
          className="absolute start-0 top-full z-50 mt-2 w-[min(90vw,380px)] rounded-card border border-line bg-surface p-4 shadow-lg"
        >
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">{fa.header.cartEmpty}</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-500">
                    <th className="pb-2 text-start font-medium">{fa.cart.columnQty}</th>
                    <th className="pb-2 text-start font-medium">{fa.cart.columnProduct}</th>
                    <th className="pb-2 text-start font-medium">{fa.cart.columnPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId} className="border-b border-line last:border-0">
                      <td className="py-2 tabular-nums">{toPersianDigits(item.qty)}</td>
                      <td className="max-w-40 truncate py-2 pe-2">{item.name}</td>
                      <td className="whitespace-nowrap py-2">
                        {formatToman(item.unitPrice * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: "success" }), "mt-4 w-full")}
              >
                {fa.cart.viewCart}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
