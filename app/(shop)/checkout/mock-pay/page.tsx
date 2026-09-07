import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { fa } from "@/lib/i18n/fa";

export const metadata: Metadata = {
  title: fa.meta.mockPayTitle,
  robots: { index: false },
};

const DEFAULT_BACKEND_PUBLIC_ORIGIN = "http://localhost:8000";

/**
 * Stand-in for the bank, used only when the backend runs with
 * PAYMENT_PROVIDER=mock — MockPaymentProvider points its payment_url here
 * (backend/app/core/payment.py), so without this page a mock checkout dead-ends
 * on a 404.
 *
 * The two buttons are plain links to the backend's own public callback, which
 * is exactly what ZarinPal would hit: same URL, same `Authority`/`Status`
 * parameters, same server-side verification and same redirect back to the
 * order. Nothing here decides that a payment succeeded — this page only
 * chooses which answer the fake gateway gives.
 *
 * It 404s outside development so a production deploy can never expose a
 * one-click "mark my order paid" route, even if the provider were
 * misconfigured.
 */
export default async function MockPayPage({
  searchParams,
}: {
  searchParams: Promise<{ authority?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { authority } = await searchParams;
  const origin = (process.env.BACKEND_PUBLIC_ORIGIN ?? DEFAULT_BACKEND_PUBLIC_ORIGIN).replace(
    /\/+$/,
    ""
  );
  const callback = (status: "OK" | "NOK") =>
    `${origin}/api/v1/payments/callback?Authority=${encodeURIComponent(authority ?? "")}&Status=${status}`;

  return (
    <ScreenTransition screenKey="mock-pay">
      <div className="mx-auto max-w-[640px] px-5 pt-14 pb-24 lg:px-8">
        {!authority ? (
          <Panel
            title={fa.mockPay.title}
            body={fa.mockPay.missingAuthority}
            actions={
              <Link
                href="/cart"
                className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors hover:bg-emerald"
              >
                {fa.cart.title}
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-5 rounded-6 border border-dashed border-ink/22 bg-surface p-8 sm:p-10">
            <strong className="text-xl font-bold">{fa.mockPay.title}</strong>
            <p className="text-15 leading-prose text-ink/72">{fa.mockPay.body}</p>
            <code dir="ltr" className="rounded-3 bg-page px-3 py-2 text-13 text-ink/70">
              {authority}
            </code>
            <div className="flex flex-wrap gap-3">
              <a
                href={callback("OK")}
                className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors hover:bg-emerald"
              >
                {fa.mockPay.approve}
              </a>
              <a
                href={callback("NOK")}
                className="rounded-4 border border-ink/20 px-6.5 py-3.5 text-[15.5px] text-ink transition-colors hover:bg-page"
              >
                {fa.mockPay.cancel}
              </a>
            </div>
          </div>
        )}
      </div>
    </ScreenTransition>
  );
}
