"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createCategory, updateCategory } from "@/app/admin/(protected)/categories/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fa } from "@/lib/i18n/fa";
import type { CategoryFormValues } from "@/lib/types/admin";
import type { Category } from "@/lib/types/category";
import { resolveIcon } from "@/lib/utils/resolveIcon";

function toFormValues(category?: Category | null): CategoryFormValues {
  return {
    slug: category?.slug ?? "",
    name: category?.name ?? "",
    icon: category?.icon ?? "",
    parentId: category?.parentId ?? "",
    sortOrder: category?.sortOrder != null ? String(category.sortOrder) : "0",
    isActive: category?.isActive ?? true,
  };
}

export interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  initialCategory?: Category | null;
  /** All other categories, for the parent picker — excludes the category
   * being edited (a category can't be its own parent). */
  parentOptions: Category[];
}

export function CategoryForm({ mode, categoryId, initialCategory, parentOptions }: CategoryFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CategoryFormValues>(() => toFormValues(initialCategory));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const IconPreview = resolveIcon(values.icon);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === "create" ? await createCategory(values) : await updateCategory(categoryId as string, values);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={fa.admin.categories.fieldName}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
        <Input
          label={fa.admin.categories.fieldSlug}
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
          required
          dir="ltr"
        />
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={fa.admin.categories.fieldIcon}
          hint={fa.admin.categories.fieldIconHint}
          value={values.icon}
          onChange={(e) => set("icon", e.target.value)}
          dir="ltr"
          className="flex-1"
        />
        <span className="mb-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <IconPreview size={22} aria-hidden="true" />
        </span>
      </div>

      <Select
        label={fa.admin.categories.fieldParent}
        value={values.parentId}
        onChange={(e) => set("parentId", e.target.value)}
      >
        <option value="">{fa.admin.categories.fieldParentNone}</option>
        {parentOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Input
        label={fa.admin.categories.fieldSortOrder}
        type="number"
        value={values.sortOrder}
        onChange={(e) => set("sortOrder", e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm text-ink-900">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-line accent-brand-600"
        />
        {fa.admin.categories.fieldIsActive}
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {loading ? fa.admin.categories.saving : fa.admin.categories.saveButton}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/categories")}>
          {fa.admin.common.backToList}
        </Button>
      </div>
    </form>
  );
}
