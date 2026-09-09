"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchCartAction } from "@/app/(shop)/cart/actions";
import { buttonVariants } from "@/components/ui/Button";
import { formatToman, toPersianDigits, toPersianNumber } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Cart } from "@/lib/types/cart";
import { cn } from "@/lib/utils/cn";

/** Non-directional: a cart glyph never flips in RTL. */
function CartIcon() {
  return (
    <svg
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx={9} cy={20} r={1.4} fill="currentColor" stroke="none" />
      <circle cx={18} cy={20} r={1.4} fill="currentColor" stroke="none" />
    </svg>
  );
}

interface CartDropdownProps {
  /** Server-rendered line count from the cart_count cookie — the badge's
   * source of truth on every page load (see lib/session.ts for why it
   * isn't a live GET /cart/). */
  count: number;
}

/**
 * The header cart pill and its preview panel.
 *
 * The panel is mounted at all times and shown via `data-open`, so it has a
 * real exit as well as an entrance and never flashes stale content mid-close.
 * Its contents are fetched only when it first opens, from the same
 * server-backed cart the /cart page renders — there is no client-side cart
 * store to drift out of sync with the database.
 */
export function CartDropdown({ count }: CartDropdownProps) {
  const [open, setOpen] = useState(false);
  // The cart is cached together with the count it was fetched for, rather
  // than being reset by an effect when `count` changes: an add from a product
  // card revalidates the layout, Header re-renders with a new count, and that
  // mismatch is what marks the cached body stale — derived during render, no
  // cascading setState.
  const [cached, setCached] = useState<{ count: number; cart: Cart } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const cart = cached?.count === count ? cached.cart : null;
  const loading = open && count > 0 && cart === null;

  useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    fetchCartAction().then((fresh) => {
      if (!cancelled) setCached({ count, cart: fresh });
    });
    return () => {
      cancelled = true;
    };
  }, [loading, count]);

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

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={fa.header.cart}
        className="inline-flex cursor-pointer items-center gap-2.5 rounded-pill bg-bone px-4.5 py-2.5 text-sm font-semibold text-ink transition-colors duration-(--duration-state) hover:bg-surface active:translate-y-px active:scale-[0.985]"
      >
        <CartIcon />
        {/* Icon-only under `sm`, matching the search and menu controls it sits
         * between — the word costs 54px of a 335px row, which is most of the
         * header's overflow on a phone. `aria-label` on the button already
         * carries the accessible name, so nothing is lost to a screen reader. */}
        <span className="km-cart-label hidden sm:inline">{fa.header.cart}</span>
        {count > 0 && (
          // Keyed by count so the reconciler re-creates it on every change
          // and the tick fires each time the cart gains or loses a unit.
          <span key={`cnt-${count}`} className="km-cart-badge text-sm font-bold">
            {toPersianDigits(count)}
          </span>
        )}
      </button>

      <div
        data-open={String(open)}
        inert={!open}
        className="km-cartpanel absolute end-0 top-[calc(100%+12px)] z-50 w-[min(392px,calc(100vw-32px))] origin-top rounded-6 border border-ink/10 bg-surface p-5 text-ink shadow-pop"
      >
        <div className="mb-3.5 flex items-baseline justify-between">
          <strong className="text-base font-bold">{fa.cartDrawer.title}</strong>
          <span className="text-13 text-ink/68">
            {toPersianNumber(count)} {fa.cartDrawer.unit}
          </span>
        </div>

        {count === 0 ? (
          <p className="m-0 py-5 text-15 leading-[1.8] text-ink/72">{fa.cartDrawer.empty}</p>
        ) : cart === null ? (
          <div className="km-shimmer flex flex-col gap-3.5 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-13 rounded-3 bg-ink/6" />
            ))}
          </div>
        ) : (
          <div>
            <div className="km-scroll flex max-h-65 flex-col gap-3.5 overflow-y-auto">
              {items.map((line) => (
                <div key={line.productId} className="flex items-start gap-3">
                  <Image
                    src={line.image}
                    alt=""
                    width={104}
                    height={104}
                    loading="lazy"
                    className="size-13 shrink-0 rounded-3 border border-ink/8 bg-img-bg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-relaxed">{line.name}</div>
                    <div className="mt-0.5 text-13 text-ink/68">
                      {toPersianNumber(line.qty)} × {formatToman(line.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex items-baseline justify-between border-t border-ink/10 pt-4 pb-3.5">
              <span className="text-sm text-ink/70">{fa.cartDrawer.subtotal}</span>
              <strong className="text-[17px] font-bold">{formatToman(subtotal)}</strong>
            </div>
          </div>
        )}

        <Link
          href="/cart"
          onClick={() => setOpen(false)}
          className={cn(buttonVariants(), "w-full rounded-4 py-3.5 font-semibold")}
        >
          {fa.cartDrawer.view}
        </Link>
      </div>
    </div>
  );
}
