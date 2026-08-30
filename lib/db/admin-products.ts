import { redirect } from "next/navigation";
import { AdminApiError, adminApiFetch } from "@/lib/api/admin-client";
import { mapAdminProduct } from "@/lib/api/mappers";
import type { ApiProduct, ApiProductListResult } from "@/lib/api/types";
import type { AdminProduct } from "@/lib/types/admin";

/** Every read here redirects to /admin/login on a 401 (cookie present but
 * token expired/invalid) — covers the "admin navigates to a read page with
 * a stale session" case that middleware's cheap presence-only check can't. */
async function withAuthRedirect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export interface AdminProductListResult {
  items: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAdminProductList(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminProductListResult> {
  return withAuthRedirect(async () => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.pageSize ?? 20));
    const result = await adminApiFetch<ApiProductListResult>(`/admin/products/?${query.toString()}`);
    return {
      items: result.items.map(mapAdminProduct),
      total: result.total,
      page: result.page,
      pageSize: result.page_size,
    };
  });
}

export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  return withAuthRedirect(async () => {
    try {
      const raw = await adminApiFetch<ApiProduct>(`/admin/products/${encodeURIComponent(id)}`);
      return mapAdminProduct(raw);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 404) return null;
      throw err;
    }
  });
}
