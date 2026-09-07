"use server";

import { revalidatePath } from "next/cache";
import { AdminApiError, adminApiFetch } from "@/lib/api/admin-client";
import { mapAdminOrder } from "@/lib/api/mappers";
import type { ApiAdminOrder } from "@/lib/api/types";
import { fa } from "@/lib/i18n/fa";
import type { AdminOrder, OrderStatus } from "@/lib/types/admin";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function toErrorResult(err: unknown): { ok: false; error: string } {
  // The backend's invalid_status_transition detail is structured
  // ({code, from, to}), unlike most other admin errors here which are a
  // plain string message — AdminApiError.code carries just the code in
  // that case (see admin-client.ts's errorFromDetail), so it's mapped to a
  // Persian sentence rather than shown as raw English.
  if (err instanceof AdminApiError && err.code === "invalid_status_transition") {
    return { ok: false, error: fa.admin.orders.invalidTransitionError };
  }
  if (err instanceof AdminApiError) return { ok: false, error: err.message };
  return { ok: false, error: fa.admin.common.unexpectedError };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<ActionResult<AdminOrder>> {
  try {
    const updated = await adminApiFetch<ApiAdminOrder>(`/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, data: mapAdminOrder(updated) };
  } catch (err) {
    return toErrorResult(err);
  }
}
