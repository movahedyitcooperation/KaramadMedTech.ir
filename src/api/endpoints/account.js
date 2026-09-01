/* account.js — Authorization: Bearer required. Only full_name is editable on
   /account/me (contract §account); phone/email render read-only.

   Default path: profile + addresses persisted in localStorage, seeded from the
   prototype's example account. Live path: /account/me and /account/addresses. */

import { request, USE_LIVE_API } from "../client.js";
import { getSavedContact } from "../../lib/storage.js";

const PROFILE_KEY = "km.account.profile.v1";
const ADDR_KEY = "km.account.addresses.v1";

function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return fallback;
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  return value;
}

function seedProfile() {
  const contact = getSavedContact();
  const isEmail = /@/.test(contact);
  return {
    id: "acct-demo",
    full_name: "دکتر مریم رستگار",
    phone: isEmail ? null : (contact || "09121234567"),
    email: isEmail ? contact : null,
  };
}

function seedAddresses() {
  return [
    { id: "a1", title: "مطب", full_name: "مریم رستگار", phone: "09121234567", province: "تهران", city: "تهران",
      address_line: "خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۲۴۱۰، طبقه سوم", postal_code: "1969734512", is_default: true },
    { id: "a2", title: "خانه", full_name: "مریم رستگار", phone: "09121234567", province: "تهران", city: "تهران",
      address_line: "سعادت‌آباد، بلوار دریا، کوچه بهار، پلاک ۱۲، واحد ۵", postal_code: "1998714433", is_default: false },
  ];
}

export async function getMe() {
  if (USE_LIVE_API) return request("/account/me", { auth: true });
  let p = readJSON(PROFILE_KEY, null);
  if (!p) p = writeJSON(PROFILE_KEY, seedProfile());
  return p;
}

export async function updateMe(patch) {
  if (USE_LIVE_API) return request("/account/me", { method: "PATCH", body: patch, auth: true });
  const p = { ...(await getMe()), ...("full_name" in patch ? { full_name: patch.full_name } : {}) };
  return writeJSON(PROFILE_KEY, p);
}

export async function getAddresses() {
  if (USE_LIVE_API) return request("/account/addresses", { auth: true });
  let list = readJSON(ADDR_KEY, null);
  if (!list) list = writeJSON(ADDR_KEY, seedAddresses());
  return list;
}

export async function createAddress(body) {
  if (USE_LIVE_API) { await request("/account/addresses", { method: "POST", body, auth: true }); return getAddresses(); }
  const list = await getAddresses();
  const addr = { id: "a" + Date.now().toString(36), postal_code: "", ...body };
  if (addr.is_default) list.forEach((a) => (a.is_default = false));
  if (list.length === 0) addr.is_default = true;
  list.push(addr);
  return writeJSON(ADDR_KEY, list);
}

export async function updateAddress(id, patch) {
  if (USE_LIVE_API) { await request("/account/addresses/" + id, { method: "PATCH", body: patch, auth: true }); return getAddresses(); }
  const list = await getAddresses();
  const target = list.find((a) => a.id === id);
  if (target) Object.assign(target, patch);
  if (patch.is_default) list.forEach((a) => (a.is_default = a.id === id));
  return writeJSON(ADDR_KEY, list);
}

export async function deleteAddress(id) {
  if (USE_LIVE_API) { await request("/account/addresses/" + id, { method: "DELETE", auth: true }); return getAddresses(); }
  let list = await getAddresses();
  const wasDefault = list.find((a) => a.id === id)?.is_default;
  list = list.filter((a) => a.id !== id);
  if (wasDefault && list.length && !list.some((a) => a.is_default)) list[0].is_default = true;
  return writeJSON(ADDR_KEY, list);
}

export function clearAccountCache() {
  try { localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(ADDR_KEY); } catch { /* ignore */ }
}
