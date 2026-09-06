"use server";

import { revalidatePath } from "next/cache";
import { createOrder, requestPayment } from "@/lib/db/orders";
import { toPersianError } from "@/lib/i18n/errors";
import { writeCartCount } from "@/lib/session";

/**
 * Place the order, then get somewhere to pay.
 *
 * Two backend calls, deliberately in this order and not merged: `POST
 * /orders/` is the point of no return — it decrements stock and empties the
 * cart — while `POST /payments/request` only asks the gateway for a URL. If
 * the payment request fails, the order still exists in `pending_payment` and
 * the shopper can retry paying from the order page. Merging them would mean a
 * gateway hiccup lost the whole basket.
 *
 * The redirect itself happens on the client, because the payment URL is
 * usually an external origin.
 */
export type PlaceOrderResult =
  | { ok: true; orderId: string; paymentUrl: string }
  /** The order exists but payment could not be started — send them to the
   * order page, where they can try again, rather than back to a cart that is
   * now empty. */
  | { ok: true; orderId: string; paymentUrl: null; warning: string }
  | { ok: false; error: string };

export async function placeOrderAction(addressId: string): Promise<PlaceOrderResult> {
  let orderId: string;
  try {
    const order = await createOrder(addressId);
    orderId = order.id;
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }

  // The cart is gone server-side now, so the badge must follow immediately —
  // otherwise the header keeps advertising items that no longer exist.
  await writeCartCount(0);
  revalidatePath("/", "layout");

  try {
    const paymentUrl = await requestPayment(orderId);
    return { ok: true, orderId, paymentUrl };
  } catch (err) {
    return { ok: true, orderId, paymentUrl: null, warning: toPersianError(err) };
  }
}

/** Retry payment for an order that is still awaiting it. */
export async function retryPaymentAction(
  orderId: string
): Promise<{ ok: true; paymentUrl: string } | { ok: false; error: string }> {
  try {
    return { ok: true, paymentUrl: await requestPayment(orderId) };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}
