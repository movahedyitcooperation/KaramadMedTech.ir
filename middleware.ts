import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_token";

/**
 * Cheap UX gate only — checks cookie presence, never decodes/verifies the
 * JWT. Real enforcement is the backend's get_current_admin dependency
 * (backend/app/api/v1/auth.py), which validates the signature and
 * AdminUser.role == "ADMIN" on every admin-mutating route. This middleware
 * exists purely so an unauthenticated visitor doesn't see a flash of
 * protected UI before a redirect — it is not, and must not be treated as,
 * the security boundary.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has(ADMIN_COOKIE_NAME)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
