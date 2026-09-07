import { redirect } from "next/navigation";

/**
 * `/orders` is a URL shoppers guess and paste, but the order history is a tab
 * of the account rather than a screen of its own — so this forwards instead of
 * duplicating the list in two places that could drift.
 *
 * Deliberately a temporary redirect, not `permanentRedirect`: a 308 is cached
 * by the browser indefinitely, and this path is a plausible home for a real
 * order-history screen later. /orders/[id] is unaffected either way.
 */
export default function OrdersIndex() {
  redirect("/account?tab=orders");
}
