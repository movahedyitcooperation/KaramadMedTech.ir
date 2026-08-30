import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin_token";
const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

/**
 * Proxies the login call server-side and sets the httpOnly cookie on the
 * frontend's own origin. The browser never talks to the backend directly —
 * this is what lets the admin cookie work with zero cross-origin
 * complexity in both dev (frontend :3000 / backend :8000) and prod (unified
 * under one Nginx origin), and means JWT_SECRET never needs to reach the
 * frontend at all.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const apiBase = (process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");

  const res = await fetch(`${apiBase}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    return NextResponse.json(
      { error: detail?.detail ?? "ایمیل یا رمز عبور نادرست است" },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  (await cookies()).set(ADMIN_COOKIE_NAME, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });
  return NextResponse.json({ ok: true });
}
