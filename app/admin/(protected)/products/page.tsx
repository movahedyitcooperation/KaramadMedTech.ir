import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { getAdminProductList } from "@/lib/db/admin-products";
import type { AdminProduct } from "@/lib/types/admin";
import { deleteProduct } from "./actions";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q ?? "";
  const result = await getAdminProductList({ q, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const columns: DataTableColumn<AdminProduct>[] = [
    { header: fa.admin.products.colName, cell: (p) => <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-brand-600 hover:underline">{p.name}</Link> },
    { header: fa.admin.products.colSku, cell: (p) => <span dir="ltr">{p.sku}</span> },
    { header: fa.admin.products.colPrice, cell: (p) => formatToman(p.price) },
    { header: fa.admin.products.colStock, cell: (p) => p.stock },
    {
      header: fa.admin.products.colStatus,
      cell: (p) => (
        <span className={p.isActive ? "text-teal-600" : "text-ink-500"}>
          {p.isActive ? fa.admin.products.statusActive : fa.admin.products.statusInactive}
        </span>
      ),
    },
    {
      header: fa.admin.products.colActions,
      cell: (p) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/products/${p.id}/edit`}>
            <Button type="button" variant="ghost" size="sm">
              {fa.common.edit}
            </Button>
          </Link>
          <ConfirmDeleteButton
            title={fa.admin.products.deleteConfirmTitle}
            body={fa.admin.products.deleteConfirmBody(p.name)}
            onConfirm={deleteProduct.bind(null, p.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">{fa.admin.products.title}</h1>
        <Link href="/admin/products/new">
          <Button type="button">{fa.admin.products.newButton}</Button>
        </Link>
      </div>

      <form method="get" className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder={fa.admin.products.searchPlaceholder} />
      </form>

      <DataTable columns={columns} rows={result.items} rowKey={(p) => p.id} emptyLabel={fa.admin.products.emptyLabel} />

      <Pagination page={page} totalPages={totalPages} buildHref={(p) => `/admin/products?q=${encodeURIComponent(q)}&page=${p}`} />
    </div>
  );
}
