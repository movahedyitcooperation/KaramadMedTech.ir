/* auth.js — customer OTP login, phone OR email. Server constants mirrored, not
   invented: 6-digit code, 120s TTL, 5 verify attempts, 120s resend cooldown,
   30-day token (contract §auth).

   Default path: no SMS/email is sent; the demo code is 123456 (surfaced in the
   login card only when the live API is off). Live path: POST /auth/customer/*. */

import { request, USE_LIVE_API, ApiError } from "../client.js";
import { getGuestToken, clearGuestToken } from "../../lib/guest-token.js";
import { getCart, adoptCart } from "./cart.js";

export const DEMO_CODE = "123456";
export const RESEND_COOLDOWN = 120;

const PHONE_RE = /^09\d{9}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function classifyContact(raw) {
  const v = String(raw || "").trim();
  if (PHONE_RE.test(v)) return { channel: "phone", value: v };
  const lower = v.toLowerCase();
  if (EMAIL_RE.test(lower)) return { channel: "email", value: lower };
  return null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

let _attempts = 0;

/** POST /auth/customer/request-otp — { contact } -> { contact, channel, expires_in }. */
export async function requestOtp(contact) {
  if (USE_LIVE_API) {
    return request("/auth/customer/request-otp", { method: "POST", body: { contact } });
  }
  const c = classifyContact(contact);
  if (!c) throw new ApiError({ status: 422, code: "invalid_contact" });
  await sleep(480);
  _attempts = 0;
  return { contact: c.value, channel: c.channel, expires_in: RESEND_COOLDOWN };
}

/** POST /auth/customer/request-otp again (resend). Cooldown is enforced by the
   page's 120s countdown; the server would 429 otp_resend_too_soon before that. */
export async function resendOtp(contact) {
  if (USE_LIVE_API) {
    return request("/auth/customer/request-otp", { method: "POST", body: { contact } });
  }
  await sleep(300);
  _attempts = 0;
  return { expires_in: RESEND_COOLDOWN };
}

/**
 * POST /auth/customer/verify-otp — { contact, code, guest_cart_token? }
 * Always sends the guest token so the guest cart merges into the account
 * (contract §auth). Returns { access_token, token_type, expires_in, contact, cart }.
 */
export async function verifyOtp(contact, code) {
  const guest_cart_token = getGuestToken();

  if (USE_LIVE_API) {
    const res = await request("/auth/customer/verify-otp", {
      method: "POST", body: { contact, code, guest_cart_token },
    });
    adoptCart(res.cart);
    clearGuestToken();
    return res;
  }

  await sleep(420);
  if (String(code) !== DEMO_CODE) {
    _attempts += 1;
    const left = Math.max(0, 5 - _attempts);
    if (left === 0) throw new ApiError({ status: 401, code: "otp_max_attempts" });
    throw new ApiError({ status: 401, code: "otp_invalid_code", attemptsLeft: left });
  }
  _attempts = 0;
  const cart = await getCart();
  const token = "demo." + btoa(unescape(encodeURIComponent(contact))) + "." + Date.now().toString(36);
  clearGuestToken();
  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 60 * 60 * 24 * 30,
    contact,
    cart,
  };
}
