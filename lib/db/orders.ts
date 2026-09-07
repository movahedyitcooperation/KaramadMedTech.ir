import "server-only";
import { apiRequest } from "@/lib/api/client";
import { mapOrder, mapOrderList } from "@/lib/api/mappers";
import type { ApiOrder, ApiOrderListResult, ApiPaymentRequestResponse } from "@/lib/api/types";
import { getCustomerToken } from "@/lib/session";
import type { Order, OrderListResult } from "@/lib/types/order";

/**
 * Orders and payment initiation. Every route here sits behind the backend's
 * `get_current_customer` dependency and re-checks ownership per row, so a
 * missing token is a programming error rather than something to handle.
 */
async function customerIdentity() {
  const accessToken = await getCustomerToken();
  if (!accessToken) throw new Error("orders API called without a customer token");
  return { accessToken };
}

/**
 * Places the order.
 *
 * The backend does the work that matters: it re-validates every line against
 * live product data, recomputes the totals from current prices (the cart
 * holds no price snapshot), decrements stock with an atomic conditional
 * UPDATE so two shoppers cannot oversell the last unit, snapshots the address
 * and line prices onto the order, and empties the cart. Nothing here should
 * duplicate any of that — this call is the checkout.
 */
export async function createOrder(addressId: string): Promise<Order> {
  return mapOrder(
    await apiRequest<ApiOrder>("/orders/", {
      method: "POST",
      body: { address_id: addressId },
      identity: await customerIdentity(),
    })
  );
}

/**
 * Asks the payment provider for somewhere to send the shopper.
 *
 * Returns the gateway's URL (or, with PAYMENT_PROVIDER=mock, the dev mock
 * page). The gateway later calls the backend's own callback, which verifies
 * server-side before marking anything paid — the browser never carries the
 * "payment succeeded" claim.
 */
export async function requestPayment(orderId: string): Promise<string> {
  const res = await apiRequest<ApiPaymentRequestResponse>("/payments/request", {
    method: "POST",
    body: { order_id: orderId },
    identity: await customerIdentity(),
  });
  return res.payment_url;
}

export async function getOrders(page = 1, pageSize = 20): Promise<OrderListResult> {
  return mapOrderList(
    await apiRequest<ApiOrderListResult>(
      `/orders/?page=${page}&page_size=${pageSize}`,
      { identity: await customerIdentity() }
    )
  );
}

/** Null when the order does not exist *or* belongs to someone else — the
 * backend deliberately returns 404 for both, so the response never confirms
 * that an order id is real. */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    return mapOrder(
      await apiRequest<ApiOrder>(`/orders/${encodeURIComponent(orderId)}`, {
        identity: await customerIdentity(),
      })
    );
  } catch (err) {
    if (err && typeof err === "object" && "status" in err && err.status === 404) return null;
    throw err;
  }
}
