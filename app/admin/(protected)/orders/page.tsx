import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { formatJalali, formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { getAdminOrderList } from "@/lib/db/admin-orders";
import type { AdminOrder, OrderStatus } from "@/lib/types/admin";
import { ORDER_STATUSES } from "@/lib/types/admin";

const PAGE_SIZE = 20;

// Same "text is the primary cue" spirit as the products table's
// statusActive/statusInactive coloring — color is a second cue here, not a
// department-style third-cue system (this table lives in the admin panel,
// not the storefront CLAUDE.md §3's department rules govern).
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "text-warn",
  paid: "text-teal-600",
  processing: "text-brand-600",
  shipped: "text-info",
  delivered: "text-teal-600",
  cancelled: "text-danger",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status ?? "";
  const result = await getAdminOrderList({ status: status || undefined, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const columns: DataTableColumn<AdminOrder>[] = [
    {
      header: fa.admin.orders.colOrderNumber,
      cell: (o) => (
        <Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-600 hover:underline" dir="ltr">
          {o.orderNumber}
        </Link>
      ),
    },
    { header: fa.admin.orders.colCustomer, cell: (o) => <span dir="ltr">{o.contact}</span> },
    { header: fa.admin.orders.colDate, cell: (o) => formatJalali(o.createdAt) },
    { header: fa.admin.orders.colTotal, cell: (o) => formatToman(o.total) },
    {
      header: fa.admin.orders.colStatus,
      cell: (o) => <span className={STATUS_COLOR[o.status]}>{fa.admin.orders.statusLabels[o.status] ?? o.status}</span>,
    },
    {
      header: fa.admin.orders.colActions,
      cell: (o) => (
        <Link href={`/admin/orders/${o.id}`}>
          <Button type="button" variant="ghost" size="sm">
            {fa.admin.orders.viewButton}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">{fa.admin.orders.title}</h1>
      </div>

      <form method="get" className="flex max-w-md items-end gap-2">
        <select
          name="status"
          defaultValue={status}
          className="h-11 w-full rounded-input border border-line bg-surface px-4 text-sm text-ink-900"
        >
          <option value="">{fa.admin.orders.filterAllStatuses}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {fa.admin.orders.statusLabels[s] ?? s}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          {fa.admin.orders.filterApply}
        </Button>
      </form>

      <DataTable columns={columns} rows={result.items} rowKey={(o) => o.id} emptyLabel={fa.admin.orders.emptyLabel} />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => `/admin/orders?status=${encodeURIComponent(status)}&page=${p}`}
      />
    </div>
  );
}
