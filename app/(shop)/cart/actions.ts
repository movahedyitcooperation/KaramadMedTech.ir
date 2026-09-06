"use server";

import { revalidatePath } from "next/cache";
import * as cartDb from "@/lib/db/cart";
import { fa } from "@/lib/i18n/fa";
import { toPersianError } from "@/lib/i18n/errors";
import { writeCartCount } from "@/lib/session";
import type { Cart } from "@/lib/types/cart";

/**
 * Cart mutations. Every backend cart endpoint returns the WHOLE cart, so each
 * action returns the fresh cart alongside a message — callers replace their
 * state from the response and never refetch.
 *
 * Two things make this more than a thin proxy:
 *
 * 1. The server silently clamps quantity to stock (`min(qty, stock)` on add,
 *    `max(1, min(qty, stock))` on update). Comparing the requested quantity
 *    against what came back is the only way to notice, and the design's rule
 *    is that a clamp is announced in words — «فقط ۳ عدد موجود بود؛ همان تعداد
 *    به سبد اضافه شد» — through an aria-live region, never swallowed.
 *
 * 2. `cart_count` (a non-httpOnly mirror cookie) is rewritten from the
 *    authoritative response so Header's badge stays correct without a
 *    GET /cart/ on every page load. See lib/session.ts for why.
 *
 * Actions never throw to the UI: `{ ok: true, ... } | { ok: false, error }`,
 * per CLAUDE.md §5.
 */

export type CartActionResult =
  | { ok: true; cart: Cart; message: string | null }
  | { ok: false; error: string };

function lineQty(cart: Cart, productId: string): number {
  return cart.items.find((l) => l.productId === productId)?.qty ?? 0;
}

async function commit(cart: Cart, message: string | null): Promise<CartActionResult> {
  await writeCartCount(cartDb.cartCount(cart));
  // The cart page and every (shop) route render the header badge, so the
  // whole shop layout needs re-rendering, not just /cart.
  revalidatePath("/", "layout");
  return { ok: true, cart, message };
}

export async function addToCartAction(
  productId: string,
  qty: number,
  productName: string,
  stock: number
): Promise<CartActionResult> {
  if (stock <= 0) return { ok: false, error: fa.toast.addOutOfStock };

  const want = Math.max(1, Math.floor(qty) || 1);
  try {
    const before = lineQty(await cartDb.getCart(), productId);
    const cart = await cartDb.addCartItem(productId, want);
    const granted = lineQty(cart, productId) - before;
    // Fewer units than asked for came back => the server clamped to stock.
    const message = granted < want ? fa.toast.addClamped(stock) : fa.toast.added(productName);
    return await commit(cart, message);
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export async function updateCartQtyAction(
  productId: string,
  qty: number,
  stock: number
): Promise<CartActionResult> {
  const want = Math.floor(qty);
  // qty 0 from a stepper's "−" at 1 means remove, not "clamp back up to 1" —
  // the backend would clamp it to 1 and the line would look stuck.
  if (want <= 0) return removeFromCartAction(productId);

  try {
    const cart = await cartDb.updateCartItem(productId, want);
    const got = lineQty(cart, productId);
    return await commit(cart, got !== want ? fa.toast.setQtyClamped(stock) : null);
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export async function removeFromCartAction(productId: string): Promise<CartActionResult> {
  try {
    return await commit(await cartDb.removeCartItem(productId), fa.toast.removed);
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

/**
 * Reads the cart on demand — used by the header dropdown when it opens.
 *
 * Deliberately not called during an ordinary page render: the backend
 * lazily creates a CartSession row for any unseen guest token, so fetching
 * on every page load would write a database row per anonymous visit. Opening
 * the dropdown is a real intent, so paying for the row there is fine.
 */
export async function fetchCartAction(): Promise<Cart> {
  try {
    return await cartDb.getCart();
  } catch {
    return cartDb.EMPTY_CART;
  }
}
