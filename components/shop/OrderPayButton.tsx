"use client";

import { useState, useTransition } from "react";
import { retryPaymentAction } from "@/app/(shop)/checkout/actions";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";

/**
 * Resume payment for an order left in `pending_payment` — after a cancelled
 * gateway visit, a failed verification, or a payment request that never got a
 * URL. It asks for a *fresh* payment URL rather than reusing an old one:
 * authorities expire, and the backend records a new Payment row per attempt.
 */
export function OrderPayButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        loading={pending || leaving}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await retryPaymentAction(orderId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setLeaving(true);
            // External origin in production — a router navigation cannot go there.
            window.location.assign(result.paymentUrl);
          })
        }
        className="w-full rounded-4 py-3.75 text-[15.5px] font-bold"
      >
        {pending || leaving ? fa.order.paying : fa.order.payNow}
      </Button>
      <p aria-live="polite" className="min-h-4.5 text-13 leading-relaxed text-danger">
        {error}
      </p>
    </div>
  );
}
