"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, adminApiFetch, adminApiUpload } from "@/lib/api/admin-client";
import { productFormToCreatePayload, resolveImageUrl } from "@/lib/api/mappers";
import type { ApiProduct } from "@/lib/api/types";
import { fa } from "@/lib/i18n/fa";
import type { ProductFormValues } from "@/lib/types/admin";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function toErrorResult(err: unknown): { ok: false; error: string } {
  if (err instanceof AdminApiError) return { ok: false, error: err.message };
  return { ok: false, error: fa.admin.common.unexpectedError };
}

function toPayload(values: ProductFormValues) {
  return productFormToCreatePayload({
    ...values,
    description: values.description
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    price: Number(values.price),
    compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : null,
    stock: Number(values.stock),
  });
}

export async function createProduct(values: ProductFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const created = await adminApiFetch<ApiProduct>("/admin/products/", {
      method: "POST",
      body: toPayload(values),
    });
    revalidatePath("/admin/products");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function updateProduct(id: string, values: ProductFormValues): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await adminApiFetch<ApiProduct>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: toPayload(values),
    });
    revalidatePath("/admin/products");
    return { ok: true, data: { id: updated.id } };
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await adminApiFetch(`/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    revalidatePath("/admin/products");
    return { ok: true, data: undefined };
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function uploadProductImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const result = await adminApiUpload("/admin/uploads/images", formData);
    // Resolve here, server-side, so ImageUploader (client) always deals in
    // ready-to-render absolute URLs and never needs to know about
    // BACKEND_PUBLIC_ORIGIN itself.
    return { ok: true, data: { url: resolveImageUrl(result.url) } };
  } catch (err) {
    return toErrorResult(err);
  }
}
