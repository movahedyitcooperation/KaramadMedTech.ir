"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addToCartAction } from "@/app/(shop)/cart/actions";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

const ADDED_STATE_MS = 1600;

/** A check that strokes itself on — the drawn confirmation inside the
 * button. `.km-draw` animates stroke-dashoffset (app/globals.css). */
function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[15px] shrink-0"
    >
      <path d="M5 13l4 4L19 7" className="km-draw" />
    </svg>
  );
}

export interface AddToCartButtonProps {
  productId: string;
  productName: string;
  stock: number;
  qty?: number;
  className?: string;
  /** The PDP's larger, full-width treatment vs. the card's compact one. */
  size?: "card" | "pdp";
}

/**
 * The add-to-cart control, everywhere it appears.
 *
 * The click on a far-away card is answered right here, in the product's own
 * words, before the toast and the header badge catch up: the label swaps to
 * «به سبد اضافه شد» on an emerald-live-deep ground for ~1.6s. That in-place
 * completion state is the design's rule — a toast alone leaves the thing you
 * actually clicked looking untouched.
 *
 * A clamp ("you asked for 5, only 3 exist") comes back as the action's
 * `message` and is announced as a toast instead of the success state, so the
 * button never claims more than the server granted.
 */
export function AddToCartButton({
  productId,
  productName,
  stock,
  qty = 1,
  className,
  size = "card",
}: AddToCartButtonProps) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const pushToast = useToastStore((s) => s.push);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleClick() {
    startTransition(async () => {
      const result = await addToCartAction(productId, qty, productName, stock);
      if (!result.ok) {
        pushToast(result.error);
        return;
      }
      if (result.message) pushToast(result.message, `cart-${productId}-${result.message}`);
      // A clamped add returns the clamp message, not the "added" one — only
      // an add that got everything it asked for earns the success state.
      if (result.message === fa.toast.added(productName)) {
        setAdded(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAdded(false), ADDED_STATE_MS);
      }
    });
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      loading={pending}
      variant={added ? "emerald" : "ink"}
      className={cn(
        "rounded-4",
        added && "km-tick hover:bg-emerald-live-deep",
        size === "pdp" ? "h-14 min-w-[210px] flex-1 text-lg font-bold" : "w-full py-3 text-14 font-semibold",
        className
      )}
    >
      {added ? (
        <span className="inline-flex items-center gap-[7px]">
          <CheckGlyph />
          <span>{fa.card.added}</span>
        </span>
      ) : size === "pdp" ? (
        fa.pdp.buy
      ) : (
        fa.card.add
      )}
    </Button>
  );
}
