import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { fa } from "@/lib/i18n/fa";
import { getAdminCategoryById, getAdminCategoryList } from "@/lib/db/admin-categories";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [category, allCategories] = await Promise.all([getAdminCategoryById(id), getAdminCategoryList()]);
  if (!category) notFound();

  // A category can't be its own parent.
  const parentOptions = allCategories.filter((c) => c.id !== id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-ink-900">{fa.admin.categories.editTitle}</h1>
      <CategoryForm mode="edit" categoryId={id} initialCategory={category} parentOptions={parentOptions} />
    </div>
  );
}
