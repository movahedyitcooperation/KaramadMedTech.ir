"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { formatToman, parseFaDigits, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";
import { waHref } from "@/lib/utils/links";
import type { ContactSetting } from "@/lib/types/settings";

/**
 * Price, quantity stepper, add-to-cart, and the honest stock line.
 *
 * The quantity input is clamped locally against `stock` and says why in an
 * aria-live region — «حداکثر ۳ عدد موجود است» — instead of silently snapping
 * back. That's a *pre-flight* courtesy only: the server clamps again on add
 * (`min(qty, stock)`), and AddToCartButton reports that separately. Neither
 * check trusts the other.
 *
 * مقایسه and ذخیره stay visible but disabled and labelled «به‌زودی»: there is
 * no comparison or wishlist backend, and hiding the affordances entirely
 * would misrepresent the roadmap as much as faking them would.
 */
export function ProductPurchasePanel({
  product,
  contact,
}: {
  product: Product;
  contact: ContactSetting;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const outOfStock = product.stock === 0;
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discount = onSale
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  function bump(delta: number) {
    const next = qty + delta;
    if (next > product.stock) {
      setNote(fa.pdp.qtyMaxNote(product.stock));
      return;
    }
    setNote("");
    setQty(Math.max(1, next));
  }

  function setFromInput(raw: string) {
    const parsed = Number(parseFaDigits(raw)) || 1;
    const clamped = Math.max(1, Math.min(parsed, Math.max(product.stock, 1)));
    setQty(clamped);
    setNote(clamped !== parsed ? fa.pdp.qtyClampNote(product.stock) : "");
  }

  const shownNote =
    note || (product.stock > 0 && product.stock <= 3 ? fa.pdp.lowStockNote(product.stock) : "");

  return (
    <div className="flex flex-col gap-4.5 rounded-6 border border-ink/10 bg-surface p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        {onSale && (
          <span className="text-15 text-ink/42 line-through">
            {formatToman(product.compareAtPrice as number)}
          </span>
        )}
        <strong className="text-3xl font-extrabold tracking-[-0.01em]">
          {formatToman(product.price)}
        </strong>
        {onSale && (
          <span className="rounded-2 bg-danger px-2.25 py-1 text-13 font-bold text-surface">
            {fa.pdp.discount(discount)}
          </span>
        )}
      </div>

      {outOfStock ? (
        <a
          href={waHref(contact)}
          className="flex items-center justify-center gap-2.5 rounded-4 bg-ink px-7 py-4 text-[16.5px] font-bold text-surface"
        >
          <span aria-hidden="true" className="size-1.75 shrink-0 rounded-full bg-emerald-live" />
          <span>{fa.pdp.notifyRestock}</span>
        </a>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-4 border border-ink/18 bg-white">
            <button
              type="button"
              onClick={() => bump(-1)}
              aria-label={fa.pdp.qtyDown}
              className="h-12 w-11 cursor-pointer text-[19px] text-ink"
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              aria-label={fa.pdp.qty}
              value={toPersianDigits(qty)}
              onChange={(e) => setFromInput(e.target.value)}
              className="h-12 w-14 border-none bg-transparent text-center text-base font-bold text-ink"
            />
            <button
              type="button"
              onClick={() => bump(1)}
              aria-label={fa.pdp.qtyUp}
              className="h-12 w-11 cursor-pointer text-[19px] text-ink"
            >
              +
            </button>
          </div>
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            stock={product.stock}
            qty={qty}
            size="pdp"
          />
        </div>
      )}

      <div aria-live="polite" className="min-h-5 text-13 leading-[1.75] text-warn">
        {shownNote && (
          <span key={shownNote} className="km-note">
            {shownNote}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-4.5">
        {[fa.pdp.compareSoon, fa.pdp.saveSoon].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="cursor-not-allowed rounded-4 border border-dashed border-info-border bg-info-bg px-4 py-2.5 text-13 text-info"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
