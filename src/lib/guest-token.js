/* guest-token.js — the browser mints and persists the guest cart token that the
   Next.js middleware used to set. Sent as X-Guest-Cart-Token on every guest cart
   call and passed to verify-otp so the guest cart merges into the account. */

const KEY = "km.cart.guestToken";

function safeGet() { try { return localStorage.getItem(KEY); } catch { return null; } }
function safeSet(v) { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } }

/** crypto.randomUUID() is 36 chars — fits the backend's varchar(64). */
export function getGuestToken() {
  let t = safeGet();
  if (!t) {
    t = (crypto.randomUUID && crypto.randomUUID()) ||
        ("g-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10));
    safeSet(t);
  }
  return t;
}

export function clearGuestToken() {
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
}
