import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CartLineControls } from "@/components/shop/CartLineControls";
import { HighlightCard } from "@/components/ui/HighlightCard";
import { Panel } from "@/components/ui/Panel";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { cartCount, cartSubtotal, getCart } from "@/lib/db/cart";
import { getSiteSettings } from "@/lib/db/settings";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { isLoggedIn } from "@/lib/session";
import { telHref, waHref } from "@/lib/utils/links";

export const metadata: Metadata = {
  title: fa.meta.cartTitle,
  robots: { index: false },
};

export default async function CartPage() {
  const [cart, settings, loggedIn] = await Promise.all([getCart(), getSiteSettings(), isLoggedIn()]);

  const items = cart.items;
  const count = cartCount(cart);
  // Totals are computed here, from this response plus the shipping rule —
  // never cached. CartRead carries no price snapshot and no totals by design:
  // unit_price is re-joined from the product row on every read, so a price
  // change between adding and viewing is reflected immediately.
  const subtotal = cartSubtotal(cart);
  const { shipping } = settings;
  const freeShipping = shipping.mode === "free" || subtotal >= shipping.freeOver;
  const shippingCost = items.length === 0 || freeShipping ? 0 : shipping.cost;
  const total = subtotal + shippingCost;

  return (
    <ScreenTransition screenKey="cart">
      <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-20 lg:px-8">
        <h1 className="mb-2 text-h1-flat font-extrabold tracking-[-0.015em]">{fa.cart.title}</h1>
        <p aria-live="polite" className="mb-7 text-15 leading-[1.75] text-ink/60">
          <span key={`cc-${count}`} className="km-note inline-block">
            {fa.cart.count(count)}
          </span>
        </p>

        {items.length === 0 ? (
          <Panel
            title={fa.cart.emptyTitle}
            body={fa.cart.emptyBody}
            actions={
              <>
                <Link
                  href="/"
                  className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors hover:bg-emerald"
                >
                  {fa.cart.emptyCta}
                </Link>
                <a
                  href={telHref(settings.contact.phone)}
                  className="rounded-4 border border-ink/20 px-6.5 py-3.5 text-[15.5px] text-ink"
                >
                  {fa.cart.emptyCall}
                </a>
              </>
            }
          />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_372px]">
            <div className="km-stagger flex flex-col gap-3.5">
              {items.map((line) => (
                <div
                  key={line.productId}
                  className="flex flex-wrap items-start gap-4.5 rounded-6 border border-ink/9 bg-surface p-4.5"
                >
                  <Image
                    src={line.image}
                    alt=""
                    width={208}
                    height={208}
                    loading="lazy"
                    className="size-26 shrink-0 rounded-3 border border-ink/8 bg-img-bg object-cover"
                  />
                  <div className="flex min-w-50 flex-1 flex-col gap-2.5">
                    <Link
                      href={`/product/${line.slug}`}
                      className="text-start text-base leading-[1.7] font-semibold text-ink transition-colors hover:text-emerald-live"
                    >
                      {line.name}
                    </Link>
                    <div className="text-sm leading-[1.7] text-ink/58">
                      {fa.cart.unitPrice} {formatToman(line.unitPrice)}
                    </div>
                    <CartLineControls
                      productId={line.productId}
                      qty={line.qty}
                      stock={line.stock}
                    />
                  </div>
                  <strong className="text-lg font-extrabold whitespace-nowrap">
                    {formatToman(line.unitPrice * line.qty)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 lg:sticky lg:top-40">
              <div className="flex flex-col gap-3.5 rounded-6 border border-ink/10 bg-surface p-6">
                <strong className="text-[17px] font-bold">{fa.cart.summaryHeading}</strong>
                <SummaryRow label={fa.cart.subtotal} value={formatToman(subtotal)} />
                <SummaryRow
                  label={fa.cart.shipping}
                  value={freeShipping ? fa.cart.free : formatToman(shipping.cost)}
                />
                {!freeShipping && shipping.mode !== "free" && (
                  <div className="rounded-3 border border-warn-border-soft bg-warn-bg px-3 py-2.5 text-13 leading-[1.75] text-warn">
                    {fa.cart.freeShipHint(shipping.freeOver - subtotal)}
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-ink/12 pt-3.5">
                  <span className="text-[15.5px] font-semibold">{fa.cart.payable}</span>
                  <strong className="text-[22px] font-extrabold">{formatToman(total)}</strong>
                </div>
              </div>

              {/* Checkout is a real screen now, so the primary action is
               * the CTA rather than a phone number. The link is deliberately
               * plain — /checkout re-reads the cart and re-checks the login
               * server-side, so nothing here needs to guard it. A visitor
               * without a customer_token is bounced to /login by
               * middleware.ts and returns straight to checkout. */}
              <Link
                href="/checkout"
                className="rounded-4 bg-ink p-4 text-center text-base font-bold text-surface transition-colors hover:bg-emerald"
              >
                {fa.cart.checkout}
              </Link>
              {/* Only worth saying to someone who will actually be
               * interrupted by a login — a signed-in shopper goes straight
               * through. */}
              {!loggedIn && (
                <p className="-mt-1 text-center text-13 leading-[1.85] text-ink/55">
                  {fa.cart.checkoutLoginNote}
                </p>
              )}

              <HighlightCard className="flex flex-col gap-3.5">
                <strong className="text-[16.5px] leading-relaxed font-bold">
                  {fa.cart.helpTitle}
                </strong>
                <p className="text-14 leading-[1.9] text-bone/78">{fa.cart.helpBody}</p>
                <a
                  href={waHref(settings.contact)}
                  className="rounded-4 bg-bone p-3.75 text-center text-[15.5px] font-bold text-ink"
                >
                  {fa.cart.helpWhatsapp}
                </a>
                <a
                  href={telHref(settings.contact.phone)}
                  dir="ltr"
                  style={{ unicodeBidi: "plaintext" }}
                  className="rounded-4 border border-bone/34 p-3.75 text-center text-[15.5px] text-bone"
                >
                  {settings.contact.phone}
                </a>
              </HighlightCard>
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
