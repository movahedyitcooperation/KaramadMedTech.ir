"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createProduct, updateProduct, uploadProductImage } from "@/app/admin/(protected)/products/actions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SpecsRepeater } from "@/components/admin/SpecsRepeater";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { fa } from "@/lib/i18n/fa";
import type { AdminProduct, ProductFormValues } from "@/lib/types/admin";
import type { Category } from "@/lib/types/category";

function toFormValues(product?: AdminProduct | null): ProductFormValues {
  return {
    slug: product?.slug ?? "",
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    shortDesc: product?.shortDesc ?? "",
    description: product?.description.join("\n") ?? "",
    price: product?.price != null ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice != null ? String(product.compareAtPrice) : "",
    stock: product?.stock != null ? String(product.stock) : "0",
    sku: product?.sku ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    categoryId: product?.categoryId ?? "",
    images: product?.images ?? [],
    specs: product?.specs ?? [],
  };
}

export interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialProduct?: AdminProduct | null;
  categories: Category[];
}

export function ProductForm({ mode, productId, initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(() => toFormValues(initialProduct));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === "create" ? await createProduct(values) : await updateProduct(productId as string, values);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={fa.admin.products.fieldName}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
        <Input
          label={fa.admin.products.fieldSlug}
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
          required
          dir="ltr"
        />
        <Input label={fa.admin.products.fieldBrand} value={values.brand} onChange={(e) => set("brand", e.target.value)} />
        <Input
          label={fa.admin.products.fieldSku}
          value={values.sku}
          onChange={(e) => set("sku", e.target.value)}
          required
          dir="ltr"
        />
      </div>

      <Input
        label={fa.admin.products.fieldShortDesc}
        value={values.shortDesc}
        onChange={(e) => set("shortDesc", e.target.value)}
      />
      <Textarea
        label={fa.admin.products.fieldDescription}
        hint={fa.admin.products.fieldDescriptionHint}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        rows={5}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={fa.admin.products.fieldPrice}
          type="number"
          min={0}
          value={values.price}
          onChange={(e) => set("price", e.target.value)}
          required
        />
        <Input
          label={fa.admin.products.fieldCompareAtPrice}
          type="number"
          min={0}
          value={values.compareAtPrice}
          onChange={(e) => set("compareAtPrice", e.target.value)}
        />
        <Input
          label={fa.admin.products.fieldStock}
          type="number"
          min={0}
          value={values.stock}
          onChange={(e) => set("stock", e.target.value)}
          required
        />
      </div>

      <Select
        label={fa.admin.products.fieldCategory}
        value={values.categoryId}
        onChange={(e) => set("categoryId", e.target.value)}
        required
      >
        <option value="" disabled>
          {fa.admin.products.fieldCategoryPlaceholder}
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.parentId ? `— ${c.name}` : c.name}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-600"
          />
          {fa.admin.products.fieldIsActive}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-600"
          />
          {fa.admin.products.fieldIsFeatured}
        </label>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink-900">{fa.admin.products.imagesTitle}</h2>
        <ImageUploader value={values.images} onChange={(images) => set("images", images)} onUpload={uploadImage} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink-900">{fa.admin.products.specsTitle}</h2>
        <SpecsRepeater value={values.specs} onChange={(specs) => set("specs", specs)} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {loading ? fa.admin.products.saving : fa.admin.products.saveButton}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          {fa.admin.common.backToList}
        </Button>
      </div>
    </form>
  );
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadProductImage(formData);
}
