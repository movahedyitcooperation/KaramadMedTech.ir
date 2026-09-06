"use server";

import { revalidatePath } from "next/cache";
import * as authDb from "@/lib/db/auth";
import { toPersianError } from "@/lib/i18n/errors";
import { cartCount } from "@/lib/db/cart";
import { clearCustomerSession, setCustomerToken, writeCartCount } from "@/lib/session";

/**
 * Customer OTP login.
 *
 * These are Server Actions rather than Route Handlers (unlike the admin
 * login, which proxies through app/api/admin/login/route.ts) because a Server
 * Action can call cookies().set() directly, which keeps customer auth on the
 * same convention as the rest of the storefront's mutations. The backend
 * issues a stateless bearer token and knows nothing about cookies; this app
 * owns the httpOnly `customer_token` cookie.
 *
 * Nothing about the OTP itself is decided here — generation, hashing, TTL,
 * attempt caps and per-contact/per-IP rate limits all live in the backend.
 * Even the phone-vs-email classification is the server's call, from one
 * `contact` field.
 */

export type RequestOtpActionResult =
  | { ok: true; contact: string; channel: "phone" | "email"; expiresIn: number }
  | { ok: false; error: string };

export async function requestOtpAction(contact: string): Promise<RequestOtpActionResult> {
  try {
    const res = await authDb.requestOtp(contact.trim());
    return { ok: true, ...res };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export type VerifyOtpActionResult = { ok: true } | { ok: false; error: string };

export async function verifyOtpAction(
  contact: string,
  code: string
): Promise<VerifyOtpActionResult> {
  try {
    const res = await authDb.verifyOtp(contact.trim(), code.trim());
    await setCustomerToken(res.accessToken, res.expiresIn);
    // The response's cart is the account cart *after* the guest cart merged
    // into it, so the badge is correct immediately — no extra GET /cart/.
    await writeCartCount(cartCount(res.cart));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export async function logoutAction(): Promise<void> {
  await clearCustomerSession();
  revalidatePath("/", "layout");
}
