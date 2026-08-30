import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import { getAdminCategoryTree, type CategoryWithDepth } from "@/lib/db/admin-categories";
import { deleteCategory } from "./actions";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategoryTree();

  const columns: DataTableColumn<CategoryWithDepth>[] = [
    {
      header: fa.admin.categories.colName,
      cell: (c) => (
        <Link
          href={`/admin/categories/${c.id}/edit`}
          className="font-medium text-brand-600 hover:underline"
          style={{ paddingInlineStart: `${c.depth * 1.25}rem` }}
        >
          {c.depth > 0 ? "— " : ""}
          {c.name}
        </Link>
      ),
    },
    { header: fa.admin.categories.colSlug, cell: (c) => <span dir="ltr">{c.slug}</span> },
    {
      header: fa.admin.categories.colStatus,
      cell: (c) => (
        <span className={c.isActive ? "text-teal-600" : "text-ink-500"}>
          {c.isActive ? fa.admin.categories.statusActive : fa.admin.categories.statusInactive}
        </span>
      ),
    },
    {
      header: fa.admin.categories.colActions,
      cell: (c) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/categories/${c.id}/edit`}>
            <Button type="button" variant="ghost" size="sm">
              {fa.common.edit}
            </Button>
          </Link>
          <ConfirmDeleteButton
            title={fa.admin.categories.deleteConfirmTitle}
            body={fa.admin.categories.deleteConfirmBody(c.name)}
            onConfirm={deleteCategory.bind(null, c.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">{fa.admin.categories.title}</h1>
        <Link href="/admin/categories/new">
          <Button type="button">{fa.admin.categories.newButton}</Button>
        </Link>
      </div>

      <DataTable columns={columns} rows={categories} rowKey={(c) => c.id} emptyLabel={fa.admin.categories.emptyLabel} />
    </div>
  );
}
