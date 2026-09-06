import "server-only";
import { apiRequest } from "@/lib/api/client";
import { mapCart } from "@/lib/api/mappers";
import type { ApiCart } from "@/lib/api/types";
import { getApiIdentity } from "@/lib/session";
import type { Cart } from "@/lib/types/cart";

/**
 * Every cart endpoint returns the WHOLE cart, so each of these replaces local
 * state from the response and nothing ever refetches after a mutation. That
 * also means the server's clamp-to-stock (`min(qty, stock)` on add,
 * `max(1, min(qty, stock))` on update) is observable: callers compare what
 * they asked for against what came back and say so in words.
 */

export const EMPTY_CART: Cart = { id: "", items: [] };

export async function getCart(): Promise<Cart> {
  const identity = await getApiIdentity();
  // No identity at all can only happen on the very first request of a brand
  // new visit, before middleware's Set-Cookie has made a round trip. An empty
  // cart is the correct answer then — and it avoids a pointless 400.
  if (!identity.accessToken && !identity.guestCartToken) return EMPTY_CART;
  return mapCart(await apiRequest<ApiCart>("/cart/", { identity }));
}

export async function addCartItem(productId: string, qty: number): Promise<Cart> {
  return mapCart(
    await apiRequest<ApiCart>("/cart/items", {
      method: "POST",
      body: { product_id: productId, qty },
      identity: await getApiIdentity(),
    })
  );
}

export async function updateCartItem(productId: string, qty: number): Promise<Cart> {
  return mapCart(
    await apiRequest<ApiCart>(`/cart/items/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      body: { qty },
      identity: await getApiIdentity(),
    })
  );
}

export async function removeCartItem(productId: string): Promise<Cart> {
  return mapCart(
    await apiRequest<ApiCart>(`/cart/items/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      identity: await getApiIdentity(),
    })
  );
}

export function cartCount(cart: Cart): number {
  return cart.items.reduce((sum, line) => sum + line.qty, 0);
}

export function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
}
