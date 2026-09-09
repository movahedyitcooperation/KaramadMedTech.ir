import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { Panel } from "@/components/ui/Panel";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { getAddresses } from "@/lib/db/account";
import { cartSubtotal, getCart } from "@/lib/db/cart";
import { getSiteSettings } from "@/lib/db/settings";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { isLoggedIn } from "@/lib/session";

export const metadata: Metadata = {
  title: fa.meta.checkoutTitle,
  robots: { index: false },
};

/**
 * The last screen before the bank.
 *
 * It shows the totals it computes locally, but it does not send them: the
 * backend recomputes subtotal, shipping and total from live product rows when
 * the order is created, so these numbers are a preview of that calculation and
 * never an input to it. If a price moved since the cart was filled, the order
 * carries the backend's figure — which is why this page reads the cart fresh
 * on every render instead of trusting anything cached.
 */
export default async function CheckoutPage() {
  // middleware.ts redirects a tokenless visitor, but that is a UX gate, not
  // the boundary — re-check so a direct render can never call the orders API
  // without a token.
  if (!(await isLoggedIn())) redirect("/login?next=/checkout");

  const [cart, addresses, settings] = await Promise.all([
    getCart(),
    getAddresses(),
    getSiteSettings(),
  ]);

  const items = cart.items;
  const subtotal = cartSubtotal(cart);
  const { shipping } = settings;
  const freeShipping = shipping.mode === "free" || subtotal >= shipping.freeOver;
  const shippingCost = items.length === 0 || freeShipping ? 0 : shipping.cost;
  const total = subtotal + shippingCost;

  return (
    <ScreenTransition screenKey="checkout">
      <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-20 lg:px-8">
        <h1 className="mb-2 text-h1-flat font-extrabold tracking-[-0.015em]">{fa.checkout.title}</h1>
        <nav aria-label={fa.checkout.breadcrumbAria} className="mb-7 text-sm text-ink/68">
          <Link href="/cart" className="transition-colors hover:text-emerald-live">
            {fa.cart.title}
          </Link>
          <span className="px-2 text-ink/35">/</span>
          <span className="text-ink/75">{fa.checkout.breadcrumb}</span>
        </nav>

        {items.length === 0 ? (
          <Panel
            title={fa.checkout.emptyCartTitle}
            body={fa.checkout.emptyCartBody}
            actions={
              <Link
                href="/"
                className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors hover:bg-emerald"
              >
                {fa.checkout.emptyCartCta}
              </Link>
            }
          />
        ) : addresses.length === 0 ? (
          <Panel
            title={fa.checkout.noAddressTitle}
            body={fa.checkout.noAddressBody}
            actions={
              <Link
                href="/account?tab=addresses"
                className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors hover:bg-emerald"
              >
                {fa.checkout.noAddressCta}
              </Link>
            }
          />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_372px]">
            <div className="flex flex-col gap-6">
              <CheckoutForm addresses={addresses} />
              <Link
                href="/account?tab=addresses"
                className="self-start text-sm text-ink/70 underline-offset-4 transition-colors hover:text-emerald-live hover:underline"
              >
                {fa.checkout.manageAddresses}
              </Link>
            </div>

            <div className="flex flex-col gap-4 lg:sticky lg:top-40">
              <div className="flex flex-col gap-3.5 rounded-6 border border-ink/10 bg-surface p-6">
                <strong className="text-[17px] font-bold">{fa.checkout.summaryHeading}</strong>
                <SummaryRow label={fa.cart.subtotal} value={formatToman(subtotal)} />
                <SummaryRow
                  label={fa.cart.shipping}
                  value={freeShipping ? fa.cart.free : formatToman(shipping.cost)}
                />
                <div className="flex items-baseline justify-between border-t border-ink/12 pt-3.5">
                  <span className="text-[15.5px] font-semibold">{fa.cart.payable}</span>
                  <strong className="text-[22px] font-extrabold">{formatToman(total)}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-3.5 rounded-6 border border-ink/10 bg-surface p-6">
                <strong className="text-[17px] font-bold">{fa.checkout.itemsHeading}</strong>
                <ul className="flex flex-col gap-3.5">
                  {items.map((line) => (
                    <li key={line.productId} className="flex items-start gap-3">
                      <Image
                        src={line.image}
                        alt=""
                        width={128}
                        height={128}
                        loading="lazy"
                        className="size-14 shrink-0 rounded-3 border border-ink/8 bg-img-bg object-cover"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm leading-[1.7] font-semibold">{line.name}</span>
                        <span className="text-13 text-ink/70">
                          {fa.order.qty(line.qty)} × {formatToman(line.unitPrice)}
                        </span>
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap">
                        {formatToman(line.unitPrice * line.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScreenTransition>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-15 text-ink/68">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
