"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrderAction } from "@/app/(shop)/checkout/actions";
import { Button } from "@/components/ui/Button";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";
import type { Address } from "@/lib/types/account";
import { cn } from "@/lib/utils/cn";

/**
 * Address choice plus the one irreversible button on the whole storefront.
 *
 * On success the browser leaves for the payment gateway, so this uses a hard
 * `location.assign` rather than the router: the destination is an external
 * origin (or, in dev, the mock page), and a client-side navigation cannot go
 * there.
 *
 * If the order is created but the gateway request fails, the shopper is sent
 * to the order page instead of being left on a checkout screen whose cart no
 * longer exists — the order is real and payable from there.
 */
export function CheckoutForm({ addresses }: { addresses: Address[] }) {
  const [selected, setSelected] = useState(
    () => addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const pushToast = useToastStore((s) => s.push);
  const router = useRouter();

  function submit() {
    if (!selected) {
      setError(fa.checkout.addressPickOne);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction(selected);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLeaving(true);
      // `!== null` rather than a truthiness test: only that narrows the union
      // (a plain `if (result.paymentUrl)` leaves `string` in the else branch,
      // since "" is falsy).
      if (result.paymentUrl !== null) {
        // The gateway is another origin — a router navigation cannot reach it.
        window.location.assign(result.paymentUrl);
      } else {
        pushToast(result.warning);
        router.push(`/orders/${result.orderId}`);
      }
    });
  }

  const busy = pending || leaving;

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[17px] font-bold">{fa.checkout.addressHeading}</legend>
        {addresses.map((address) => (
          <label
            key={address.id}
            className={cn(
              "flex cursor-pointer gap-3 rounded-6 border bg-surface p-4.5 transition-colors duration-(--duration-state)",
              selected === address.id ? "border-emerald/50" : "border-ink/9 hover:border-ink/25"
            )}
          >
            <input
              type="radio"
              name="address"
              value={address.id}
              checked={selected === address.id}
              onChange={() => setSelected(address.id)}
              className="mt-1 size-4 shrink-0 accent-emerald"
            />
            <span className="flex flex-col gap-1.5">
              <span className="flex flex-wrap items-center gap-2.5">
                <strong className="text-base font-bold">{address.title}</strong>
                {address.isDefault && (
                  <span className="rounded-2 bg-emerald px-2.5 py-1 text-12 font-bold text-bone">
                    {fa.account.defaultBadge}
                  </span>
                )}
              </span>
              <span className="text-15 leading-[1.9] text-ink/75">
                {address.province}، {address.city}، {address.addressLine}
              </span>
              <span className="text-sm leading-[1.8] text-ink/55">
                {address.fullName} —{" "}
                <span dir="ltr" className="inline-block">
                  {toPersianDigits(address.phone)}
                </span>
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div aria-live="polite" className="min-h-5 text-13 leading-relaxed text-danger">
        {error && (
          <span key={error} className="km-note">
            {error}
          </span>
        )}
      </div>

      <Button
        type="button"
        onClick={submit}
        loading={busy}
        className="w-full rounded-4 py-4 text-base font-bold"
      >
        {leaving ? fa.checkout.redirecting : pending ? fa.checkout.placing : fa.checkout.place}
      </Button>

      <p className="text-12 leading-[1.85] text-ink/55">{fa.checkout.securityNote}</p>
    </div>
  );
}
