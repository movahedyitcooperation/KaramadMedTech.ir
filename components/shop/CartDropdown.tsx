"use client";

import { ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatToman, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useCartStore } from "@/lib/stores/cart-store";

interface CartDropdownProps {
  /** Server-rendered count from the cart_count cookie (CLAUDE.md §9) — the
   * source of truth for the badge. The panel body below still reads the
   * (soon-to-be-deleted) client cart store until Stage 3 rewires it to the
   * real server-backed cart; the two can disagree until then. */
  initialCount: number;
}

export function CartDropdown({ initialCount }: CartDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = useCartStore((s) => s.items);

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
        className="relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill bg-bone px-4 text-sm font-medium text-ink transition-colors duration-(--duration-state) hover:bg-surface"
      >
        <ShoppingCart size={20} aria-hidden="true" />
        <span className="hidden km-cart-label sm:inline">{fa.header.cartButton}</span>
        {initialCount > 0 && (
          <span
            key={`cnt-${initialCount}`}
            className="km-cart-badge absolute -top-2 -end-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-surface"
          >
            {toPersianDigits(initialCount)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={fa.cart.dropdownTitle}
          className="km-panel absolute start-0 top-full z-50 mt-2 w-[min(90vw,392px)] rounded-6 border border-ink/10 bg-surface p-5 text-ink shadow-pop"
        >
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/60">{fa.header.cartEmpty}</p>
          ) : (
            <>
              <table className="km-scroll w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-ink/60">
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
              <Link href="/cart" onClick={() => setOpen(false)}>
                <Button variant="ink" className="mt-4 w-full">
                  {fa.cart.viewCart}
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
