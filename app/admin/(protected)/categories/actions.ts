"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, adminApiFetch } from "@/lib/api/admin-client";
import { categoryFormToPayload } from "@/lib/api/mappers";
import type { ApiCategoryRead } from "@/lib/api/types";
import { fa } from "@/lib/i18n/fa";
import type { CategoryFormValues } from "@/lib/types/admin";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function toErrorResult(err: unknown): { ok: false; error: string } {
  if (err instanceof AdminApiError) {
    // Only ever raised by the delete route's product-in-use guard — checked
    // here rather than per call site since no other admin-category error
    // carries this code.
    if (err.code === "category_has_products") {
      return { ok: false, error: fa.admin.categories.deleteBlockedByProducts };
    }
    return { ok: false, error: err.message };
  }
  return { ok: false, error: fa.admin.common.unexpectedError };
}

function toPayload(values: CategoryFormValues) {
  return categoryFormToPayload({
    ...values,
    parentId: values.parentId || null,
    sortOrder: Number(values.sortOrder),
  });
}

export async function createCategory(values: CategoryFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const created = await adminApiFetch<ApiCategoryRead>("/admin/categories/", {
      method: "POST",
      body: toPayload(values),
    });
    revalidatePath("/admin/categories");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function updateCategory(id: string, values: CategoryFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await adminApiFetch<ApiCategoryRead>(`/admin/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: toPayload(values),
    });
    revalidatePath("/admin/categories");
    return { ok: true, data: { id: updated.id } };
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await adminApiFetch(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
    revalidatePath("/admin/categories");
    return { ok: true, data: undefined };
  } catch (err) {
    return toErrorResult(err);
  }
}
