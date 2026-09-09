"use client";

import { useTransition } from "react";
import { removeFromCartAction, updateCartQtyAction } from "@/app/(shop)/cart/actions";
import { parseFaDigits, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";

/**
 * The stepper and remove control for one cart line.
 *
 * Deliberately not optimistic: `unit_price` and `stock` are re-joined fresh
 * from the product row on every cart read, so the response is the only thing
 * that knows what actually happened. The action revalidates the layout and
 * the page re-renders from the server's cart — and any clamp the server
 * applied is announced as a toast rather than silently swallowed.
 */
export function CartLineControls({
  productId,
  qty,
  stock,
}: {
  productId: string;
  qty: number;
  stock: number;
}) {
  const [pending, startTransition] = useTransition();
  const pushToast = useToastStore((s) => s.push);

  function setQty(next: number) {
    startTransition(async () => {
      const result = await updateCartQtyAction(productId, next, stock);
      if (!result.ok) pushToast(result.error);
      else if (result.message) pushToast(result.message, `qty-${productId}`);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeFromCartAction(productId);
      pushToast(result.ok ? (result.message ?? fa.toast.removed) : result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3.5" aria-busy={pending}>
      <div className="flex items-center overflow-hidden rounded-4 border border-ink/18 bg-white">
        <button
          type="button"
          onClick={() => setQty(qty - 1)}
          disabled={pending}
          aria-label={fa.cart.qtyDown}
          className="h-10.5 w-10 cursor-pointer text-lg text-ink disabled:opacity-50"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={fa.cart.qty}
          defaultValue={toPersianDigits(qty)}
          key={qty}
          onBlur={(e) => {
            const next = Number(parseFaDigits(e.target.value));
            if (next && next !== qty) setQty(next);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const next = Number(parseFaDigits(e.currentTarget.value));
            if (next && next !== qty) setQty(next);
          }}
          className="h-10.5 w-13 border-none bg-transparent text-center text-15 font-bold text-ink"
        />
        <button
          type="button"
          onClick={() => setQty(qty + 1)}
          disabled={pending}
          aria-label={fa.cart.qtyUp}
          className="h-10.5 w-10 cursor-pointer text-lg text-ink disabled:opacity-50"
        >
          +
        </button>
      </div>

      <span className="text-13 text-ink/68">{fa.cart.stockHint(stock)}</span>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="ms-auto cursor-pointer text-13 text-danger disabled:opacity-50"
      >
        {fa.cart.remove}
      </button>
    </div>
  );
}
