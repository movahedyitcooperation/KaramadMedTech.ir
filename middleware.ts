import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_token";
const CUSTOMER_COOKIE_NAME = "customer_token";
const GUEST_CART_COOKIE_NAME = "guest_cart_token";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isSafeNextPath(value: string | null): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

/**
 * Three independent, cheap UX gates, each its own `if` block keyed on
 * pathname prefix — never merged into one condition, so a bug in one
 * check can't accidentally widen another's scope. None of these is the
 * real security boundary: enforcement is always the backend's
 * get_current_admin / get_current_customer dependency (see CLAUDE.md §6's
 * "Admin auth pattern" / "Customer auth pattern" sections). A bug here
 * should degrade to "confusing redirect," never to "unauthenticated write
 * succeeds."
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin gate — unchanged from before this stage.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has(ADMIN_COOKIE_NAME)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withGuestCartCookie(request, NextResponse.redirect(loginUrl));
  }

  // 2. Customer account gate.
  if (pathname.startsWith("/account") && !request.cookies.has(CUSTOMER_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withGuestCartCookie(request, NextResponse.redirect(loginUrl));
  }

  // 3. Already-logged-in visitor hitting /login — bounce to `next` (open-
  // redirect guarded: must be an internal, single-slash path) or /account.
  if (pathname === "/login" && request.cookies.has(CUSTOMER_COOKIE_NAME)) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const target = isSafeNextPath(nextParam) ? nextParam : "/account";
    return withGuestCartCookie(request, NextResponse.redirect(new URL(target, request.url)));
  }

  return withGuestCartCookie(request, null);
}

/**
 * Mints a guest_cart_token for any visitor who lacks one yet — every
 * visitor, not just shop routes (a first visit to /login or /admin/login
 * still needs a stable guest identity established beforehand). The cart's
 * actual contents live in Postgres, keyed by this opaque token; the cookie
 * itself is never a data payload.
 *
 * `redirect` is the response to decorate when one of the gates above already
 * decided to redirect; pass null to continue to the route.
 */
function withGuestCartCookie(request: NextRequest, redirect: NextResponse | null): NextResponse {
  if (request.cookies.has(GUEST_CART_COOKIE_NAME)) {
    return redirect ?? NextResponse.next();
  }
  const token = crypto.randomUUID();
  // Setting it on `request.cookies` and then passing that request through
  // `NextResponse.next({ request })` is what makes the value readable during
  // THIS request's render. Plain `NextResponse.next()` would only ship the
  // Set-Cookie header, so the visitor's very first page render would still
  // see no guest token and every cart call on it would 400.
  request.cookies.set(GUEST_CART_COOKIE_NAME, token);
  const response = redirect ?? NextResponse.next({ request });
  response.cookies.set(GUEST_CART_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)"],
};
