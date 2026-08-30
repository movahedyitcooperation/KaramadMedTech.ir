import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { fa } from "@/lib/i18n/fa";
import { getAdminCategoryList } from "@/lib/db/admin-categories";
import { getAdminProductById } from "@/lib/db/admin-products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProductById(id), getAdminCategoryList()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-ink-900">{fa.admin.products.editTitle}</h1>
      <ProductForm mode="edit" productId={id} initialProduct={product} categories={categories} />
    </div>
  );
}
