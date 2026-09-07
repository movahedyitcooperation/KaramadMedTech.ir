import { redirect } from "next/navigation";
import { AdminApiError, adminApiFetch } from "@/lib/api/admin-client";
import { mapAdminOrder } from "@/lib/api/mappers";
import type { ApiAdminOrder, ApiAdminOrderListResult } from "@/lib/api/types";
import type { AdminOrder } from "@/lib/types/admin";

/** Same "redirect to /admin/login on a stale-session 401" guard as
 * admin-products.ts — see that file's own comment for why this can't be
 * middleware's job. */
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

export interface AdminOrderListResult {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAdminOrderList(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminOrderListResult> {
  return withAuthRedirect(async () => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.pageSize ?? 20));
    const result = await adminApiFetch<ApiAdminOrderListResult>(`/admin/orders/?${query.toString()}`);
    return {
      items: result.items.map(mapAdminOrder),
      total: result.total,
      page: result.page,
      pageSize: result.page_size,
    };
  });
}

export async function getAdminOrderById(id: string): Promise<AdminOrder | null> {
  return withAuthRedirect(async () => {
    try {
      const raw = await adminApiFetch<ApiAdminOrder>(`/admin/orders/${encodeURIComponent(id)}`);
      return mapAdminOrder(raw);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 404) return null;
      throw err;
    }
  });
}
