/* storage.js — localStorage access for the auth token.

   DESIGN.md §1.3 — accepted tradeoff: the 30-day JWT lives in localStorage and is
   readable by any script that achieves XSS on this origin, which the previous
   httpOnly-cookie + Next.js middleware architecture prevented. Taken for a
   no-server frontend. Mitigations assumed: no third-party scripts on the origin,
   no innerHTML of API strings, and a CSP without `unsafe-inline` for scripts once
   deployed. Revisit if the backend gains a cookie-setting refresh endpoint. */

const TOKEN_KEY = "km.auth.token";
const CONTACT_KEY = "km.auth.contact";

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch { /* private mode */ }
}

export function getToken() { return safeGet(TOKEN_KEY); }
export function setToken(t) { safeSet(TOKEN_KEY, t); }
export function clearToken() { safeRemove(TOKEN_KEY); safeRemove(CONTACT_KEY); }

export function getSavedContact() { return safeGet(CONTACT_KEY) || ""; }
export function setSavedContact(c) { safeSet(CONTACT_KEY, c); }

export function isLoggedIn() { return !!getToken(); }
