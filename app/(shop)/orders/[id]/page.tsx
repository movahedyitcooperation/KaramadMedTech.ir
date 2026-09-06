import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OrderPayButton } from "@/components/shop/OrderPayButton";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { Panel } from "@/components/ui/Panel";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { getOrder } from "@/lib/db/orders";
import { formatToman, toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { isLoggedIn } from "@/lib/session";
import { cn } from "@/lib/utils/cn";

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = (await isLoggedIn()) ? await getOrder(id) : null;
  return {
    title: order ? fa.meta.orderTitle(order.orderNumber) : fa.meta.accountTitle,
    robots: { index: false },
  };
}

/**
 * The three outcomes the backend callback can report, and how each reads.
 *
 * The banner is the server's verdict relayed through the redirect, not the
 * browser's claim. The order's own status is rendered right beside it, so a
 * stale or hand-typed `?payment=success` cannot make an unpaid order look
 * paid — the badge would still say "awaiting payment".
 */
const OUTCOMES = {
  success: { title: fa.order.paidTitle, body: fa.order.paidBody, tone: "ok" },
  failed: { title: fa.order.failedTitle, body: fa.order.failedBody, tone: "bad" },
  cancelled: { title: fa.order.cancelledTitle, body: fa.order.cancelledBody, tone: "warn" },
} as const;

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  if (!(await isLoggedIn())) {
    const { id } = await params;
    redirect(`/login?next=/orders/${id}`);
  }

  const [{ id }, { payment }] = await Promise.all([params, searchParams]);
  const order = await getOrder(id);

  if (!order) {
    return (
      <ScreenTransition screenKey={`order:${id}`}>
        <div className="mx-auto max-w-[820px] px-5 pt-12 pb-24 lg:px-8">
          <Panel
            title={fa.order.notFoundTitle}
            body={fa.order.notFoundBody}
            actions={
              <Link
                href="/account?tab=orders"
                className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors hover:bg-emerald"
              >
                {fa.order.backToOrders}
              </Link>
            }
          />
        </div>
      </ScreenTransition>
    );
  }

  const outcome = payment && payment in OUTCOMES ? OUTCOMES[payment as keyof typeof OUTCOMES] : null;
  const payable = order.status === "pending_payment";
  const addr = order.address;

  return (
    <ScreenTransition screenKey={`order:${order.id}`}>
      <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-22 lg:px-8">
        <Link
          href="/account?tab=orders"
          className="mb-5 inline-block text-sm text-ink/60 transition-colors hover:text-emerald-live"
        >
          ← {fa.order.backToOrders}
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-3.5">
          <h1 className="text-h1-flat font-extrabold tracking-[-0.015em]">
            {fa.order.title(order.orderNumber)}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        {outcome && (
          <div
            role="status"
            className={cn(
              "mb-7 rounded-6 border p-5",
              outcome.tone === "ok" && "border-emerald/35 bg-emerald/8",
              outcome.tone === "bad" && "border-danger/35 bg-danger/8",
              outcome.tone === "warn" && "border-warn-border-soft bg-warn-bg"
            )}
          >
            <strong className="block text-[16.5px] font-bold">{outcome.title}</strong>
            <p className="mt-1.5 text-15 leading-[1.9] text-ink/72">{outcome.body}</p>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_372px]">
          <div className="flex flex-col gap-4">
            <section className="rounded-6 border border-ink/10 bg-surface p-6">
              <strong className="mb-4 block text-[17px] font-bold">{fa.order.itemsHeading}</strong>
              <ul className="flex flex-col gap-4">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.productSku}-${index}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 border-b border-ink/8 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex min-w-50 flex-1 flex-col gap-1.5">
                      {/* Every line is a snapshot taken at checkout: the
                       * product may since have been renamed, repriced or
                       * removed, so nothing here is re-read from the catalog
                       * and nothing links back to it. */}
                      <span className="text-base leading-[1.7] font-semibold">
                        {item.productName}
                      </span>
                      <span className="text-13 text-ink/55">
                        {fa.order.sku}{" "}
                        <span dir="ltr" className="inline-block">
                          {item.productSku}
                        </span>
                      </span>
                      <span className="text-sm text-ink/62">
                        {fa.order.qty(item.qty)} × {formatToman(item.unitPrice)}
                      </span>
                    </div>
                    <strong className="text-base font-bold whitespace-nowrap">
                      {formatToman(item.unitPrice * item.qty)}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-6 border border-ink/10 bg-surface p-6">
              <strong className="mb-3 block text-[17px] font-bold">
                {fa.order.addressHeading}
              </strong>
              <p className="text-15 leading-[1.95] text-ink/78">
                {addr.province}، {addr.city}، {addr.line}
              </p>
              <p className="mt-1.5 text-sm leading-[1.85] text-ink/58">
                {addr.fullName} —{" "}
                <span dir="ltr" className="inline-block">
                  {toPersianDigits(addr.phone)}
                </span>
                {addr.postalCode && (
                  <>
                    {" — "}
                    {fa.account.postalLabel}{" "}
                    <span dir="ltr" className="inline-block">
                      {toPersianDigits(addr.postalCode)}
                    </span>
                  </>
                )}
              </p>
            </section>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-40">
            <div className="flex flex-col gap-3.5 rounded-6 border border-ink/10 bg-surface p-6">
              <strong className="text-[17px] font-bold">{fa.order.summaryHeading}</strong>
              <SummaryRow label={fa.order.subtotal} value={formatToman(order.subtotal)} />
              <SummaryRow
                label={fa.order.shipping}
                value={order.shippingCost === 0 ? fa.order.free : formatToman(order.shippingCost)}
              />
              <div className="flex items-baseline justify-between border-t border-ink/12 pt-3.5">
                <span className="text-[15.5px] font-semibold">{fa.order.payable}</span>
                <strong className="text-[22px] font-extrabold">{formatToman(order.total)}</strong>
              </div>
            </div>

            {payable && (
              <div className="flex flex-col gap-3 rounded-6 border border-ink/10 bg-surface p-6">
                <p className="text-14 leading-[1.9] text-ink/70">{fa.order.awaitingPaymentBody}</p>
                <OrderPayButton orderId={order.id} />
              </div>
            )}
          </div>
        </div>
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
