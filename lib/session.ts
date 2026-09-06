import "server-only";
import { cookies } from "next/headers";
import type { ApiIdentity } from "@/lib/api/client";

/**
 * The three storefront cookies and the one helper that turns them into an
 * ApiIdentity. Cookie *names* are duplicated in middleware.ts on purpose:
 * middleware runs in the Edge runtime and must not import "server-only"
 * modules, so the two files agree by convention, not by import.
 */
export const CUSTOMER_TOKEN_COOKIE = "customer_token";
export const GUEST_CART_COOKIE = "guest_cart_token";

/**
 * A non-httpOnly mirror of the cart's line count.
 *
 * Header renders on every request and needs the badge to be correct and
 * hydration-safe. Reading this cookie is free; calling GET /cart/ instead
 * would create a database row for every anonymous visitor who never touches
 * the cart, because the backend lazily creates a CartSession for any unseen
 * guest token (backend/app/api/v1/cart.py's get_cart_owner). Every cart
 * mutation rewrites it from the authoritative response, so it can lag but
 * never drifts: the cart page itself always renders from a real GET /cart/.
 */
export const CART_COUNT_COOKIE = "cart_count";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getCustomerToken(): Promise<string | null> {
  return (await cookies()).get(CUSTOMER_TOKEN_COOKIE)?.value ?? null;
}

export async function getGuestCartToken(): Promise<string | null> {
  return (await cookies()).get(GUEST_CART_COOKIE)?.value ?? null;
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getCustomerToken()) !== null;
}

/** Bearer token if signed in, else the guest cart token. Never both. */
export async function getApiIdentity(): Promise<ApiIdentity> {
  const accessToken = await getCustomerToken();
  if (accessToken) return { accessToken };
  return { guestCartToken: await getGuestCartToken() };
}

export async function readCartCount(): Promise<number> {
  const raw = (await cookies()).get(CART_COUNT_COOKIE)?.value;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Callable only from a Server Action or Route Handler (cookies().set()). */
export async function writeCartCount(count: number): Promise<void> {
  (await cookies()).set(CART_COUNT_COOKIE, String(count), {
    httpOnly: false, // read by Header on the server; no secret in it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function setCustomerToken(token: string, expiresInSeconds: number): Promise<void> {
  (await cookies()).set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresInSeconds,
  });
}

/**
 * Clears the session on logout, and drops the guest cart token with it.
 *
 * Dropping the guest token matters: middleware mints a fresh one on the next
 * request, so the account's cart can't leak to whoever uses this device next.
 * The backend already cleared the old guest token at verify-otp time (it
 * merged that cart into the account), so nothing is orphaned by this.
 */
export async function clearCustomerSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(CUSTOMER_TOKEN_COOKIE);
  jar.delete(GUEST_CART_COOKIE);
  jar.set(CART_COUNT_COOKIE, "0", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
