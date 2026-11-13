import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { adminRoutes, publicAdminPaths } from "@/config/admin-routes";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Must match `advanced.cookiePrefix` in `src/lib/auth.ts`. */
const AUTH_COOKIE_PREFIX = "bec";

/**
 * - Public site: locale routing (next-intl).
 * - Admin: an optimistic check that a session cookie exists, so signed-out visitors go straight
 *   to the sign-in page. It never decides access: pages and actions verify the session and
 *   permissions on the server (`features/users/session.ts`, ADR-025).
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname !== adminRoutes.home && !pathname.startsWith(`${adminRoutes.home}/`)) {
    return intlMiddleware(request);
  }

  if (publicAdminPaths.includes(pathname)) return NextResponse.next();
  if (getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) return NextResponse.next();

  const signIn = new URL(adminRoutes.signIn, request.url);
  signIn.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    // Everything except API routes, Next.js internals and files with an extension.
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
