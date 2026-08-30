import { ProductForm } from "@/components/admin/ProductForm";
import { fa } from "@/lib/i18n/fa";
import { getAdminCategoryList } from "@/lib/db/admin-categories";

export default async function NewProductPage() {
  const categories = await getAdminCategoryList();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-ink-900">{fa.admin.products.createTitle}</h1>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
