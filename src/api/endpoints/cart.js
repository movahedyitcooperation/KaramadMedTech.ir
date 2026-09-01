/* cart.js — guest or authenticated cart. Every endpoint returns the WHOLE cart;
   callers replace state from the response and never refetch after a mutation.

   Live path: /cart/ with X-Guest-Cart-Token (or Bearer). Default path: a cart
   persisted in localStorage, with the server's clamp-to-stock behaviour mirrored
   so the "فقط ۳ عدد موجود بود" surfacing is exercised.

   Totals are NEVER stored — the cart page computes subtotal/shipping/total from
   this response plus settings.shipping (contract §Cart). */

import { request, USE_LIVE_API } from "../client.js";
import { PRODUCTS } from "../fixture.js";

const KEY = "km.cart.v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* private mode */ }
  return { id: "guest-cart", items: [] };
}
function save(cart) {
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* private mode */ }
  return cart;
}

/** Re-join unit_price / stock fresh from the catalog on every read (no snapshot). */
function reprice(cart) {
  cart.items = cart.items
    .map((line) => {
      const p = PRODUCTS.find((x) => x.id === line.product_id || x.slug === line.slug);
      if (!p) return null;
      return {
        product_id: p.id, slug: p.slug, name: p.name,
        image: p.images[0] ? p.images[0].url : null,
        image_pos: p.images[0] ? p.images[0].pos : null,
        unit_price: p.price, qty: Math.max(1, Math.min(line.qty, p.stock || 0)), stock: p.stock,
      };
    })
    .filter(Boolean)
    .filter((l) => l.stock > 0 || l.qty > 0);
  return cart;
}

export async function getCart() {
  if (USE_LIVE_API) return request("/cart/", { auth: true, guestCart: true });
  return reprice(load());
}

/** POST /cart/items — adding an existing product adds to current qty. */
export async function addItem(productId, qty = 1) {
  if (USE_LIVE_API) {
    return request("/cart/items", { method: "POST", body: { product_id: productId, qty }, auth: true, guestCart: true });
  }
  const cart = load();
  const p = PRODUCTS.find((x) => x.id === productId || x.slug === productId);
  if (!p) return reprice(cart);
  const i = cart.items.findIndex((l) => l.product_id === p.id);
  const already = i >= 0 ? cart.items[i].qty : 0;
  const granted = Math.min(already + Math.max(1, qty), p.stock);
  if (i >= 0) cart.items[i].qty = granted;
  else cart.items.push({ product_id: p.id, slug: p.slug, name: p.name, unit_price: p.price, qty: granted, stock: p.stock });
  return reprice(save(cart));
}

/** PATCH /cart/items/{product_id} — keyed by product_id; clamps to max(1,min(qty,stock)). */
export async function setItem(productId, qty) {
  if (USE_LIVE_API) {
    return request("/cart/items/" + encodeURIComponent(productId), { method: "PATCH", body: { qty }, auth: true, guestCart: true });
  }
  const cart = load();
  const line = cart.items.find((l) => l.product_id === productId);
  if (line) line.qty = Math.max(1, Math.min(qty, line.stock));
  return reprice(save(cart));
}

/** DELETE /cart/items/{product_id} — silent no-op if absent, still returns the cart. */
export async function removeItem(productId) {
  if (USE_LIVE_API) {
    return request("/cart/items/" + encodeURIComponent(productId), { method: "DELETE", auth: true, guestCart: true });
  }
  const cart = load();
  cart.items = cart.items.filter((l) => l.product_id !== productId);
  return reprice(save(cart));
}

/** Replace local cart state from a verify-otp merge response (contract §auth). */
export function adoptCart(cart) {
  if (cart) save(cart);
}
