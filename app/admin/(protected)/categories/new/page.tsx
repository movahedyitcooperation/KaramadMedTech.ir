import { CategoryForm } from "@/components/admin/CategoryForm";
import { fa } from "@/lib/i18n/fa";
import { getAdminCategoryList } from "@/lib/db/admin-categories";

export default async function NewCategoryPage() {
  const parentOptions = await getAdminCategoryList();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-ink-900">{fa.admin.categories.createTitle}</h1>
      <CategoryForm mode="create" parentOptions={parentOptions} />
    </div>
  );
}
