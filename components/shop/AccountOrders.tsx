import Link from "next/link";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { Panel } from "@/components/ui/Panel";
import { formatJalali, formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Order } from "@/lib/types/order";

/**
 * The order history.
 *
 * Each row is a summary only — the backend already returns newest first, and
 * every detail lives one click away on /orders/[id].
 */
export function AccountOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <Panel
        title={fa.account.ordersEmptyTitle}
        body={fa.account.ordersEmptyBody}
        actions={
          <Link
            href="/"
            className="rounded-4 bg-ink px-6.5 py-3.25 text-15 font-semibold text-surface transition-colors hover:bg-emerald"
          >
            {fa.account.ordersEmptyCta}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-15 text-ink/60">{fa.orders.count(orders.length)}</p>
      {orders.map((order) => {
        const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
        return (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3.5 rounded-6 border border-ink/9 bg-surface p-5"
          >
            <div className="flex min-w-45 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-base font-bold">
                  {fa.order.title(order.orderNumber)}
                </strong>
                <OrderStatusBadge status={order.status} />
              </div>
              <span className="text-sm text-ink/58">
                {fa.orders.itemCount(itemCount)} — {formatJalali(order.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <strong className="text-[17px] font-extrabold whitespace-nowrap">
                {formatToman(order.total)}
              </strong>
              <Link
                href={`/orders/${order.id}`}
                className="rounded-4 border border-ink/18 px-4.5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-page"
              >
                {order.status === "pending_payment" ? fa.orders.payNow : fa.orders.view}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
