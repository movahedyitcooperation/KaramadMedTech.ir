import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { formatJalali, formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { getAdminOrderById } from "@/lib/db/admin-orders";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
          ← {fa.admin.orders.backToList}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink-900" dir="ltr">
            {order.orderNumber}
          </h1>
          <span className="text-sm text-ink-500">{formatJalali(order.createdAt)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-card border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{fa.admin.orders.sectionAddress}</h2>
            <dl className="grid gap-2 text-sm text-ink-900 sm:grid-cols-2">
              <div>
                <dt className="text-ink-500">{order.addressTitle}</dt>
                <dd>{order.addressFullName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">تلفن</dt>
                <dd dir="ltr">{order.addressPhone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ink-500">آدرس</dt>
                <dd>
                  {order.addressProvince}، {order.addressCity}، {order.addressLine}
                  {order.addressPostalCode ? ` — ${order.addressPostalCode}` : ""}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-line bg-surface shadow-soft">
            <h2 className="p-5 pb-0 text-sm font-semibold text-ink-900">{fa.admin.orders.sectionItems}</h2>
            <div className="relative overflow-x-auto p-5">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-2 py-2 text-start font-medium text-ink-500">{fa.admin.orders.colProduct}</th>
                    <th className="px-2 py-2 text-start font-medium text-ink-500">{fa.admin.orders.colSku}</th>
                    <th className="px-2 py-2 text-start font-medium text-ink-500">{fa.admin.orders.colUnitPrice}</th>
                    <th className="px-2 py-2 text-start font-medium text-ink-500">{fa.admin.orders.colQty}</th>
                    <th className="px-2 py-2 text-start font-medium text-ink-500">{fa.admin.orders.colLineTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-line last:border-0">
                      <td className="px-2 py-2 text-ink-900">
                        {item.productId ? (
                          item.productName
                        ) : (
                          <span className="text-ink-500">
                            {item.productName} {fa.admin.orders.productDeleted}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-ink-900" dir="ltr">
                        {item.productSku}
                      </td>
                      <td className="px-2 py-2 text-ink-900">{formatToman(item.unitPrice)}</td>
                      <td className="px-2 py-2 text-ink-900">{item.qty}</td>
                      <td className="px-2 py-2 text-ink-900">{formatToman(item.unitPrice * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{fa.admin.orders.sectionSummary}</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{fa.admin.orders.subtotalLabel}</dt>
                <dd className="text-ink-900">{formatToman(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{fa.admin.orders.shippingLabel}</dt>
                <dd className="text-ink-900">
                  {order.shippingCost === 0 ? fa.admin.orders.shippingFree : formatToman(order.shippingCost)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2 font-semibold">
                <dt className="text-ink-900">{fa.admin.orders.totalLabel}</dt>
                <dd className="text-ink-900">{formatToman(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">{fa.admin.orders.sectionStatus}</h2>
            <p className="mb-3 text-sm text-ink-900">
              {fa.admin.orders.colStatus}: <strong>{fa.admin.orders.statusLabels[order.status] ?? order.status}</strong>
            </p>
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </section>
        </div>
      </div>
    </div>
  );
}
