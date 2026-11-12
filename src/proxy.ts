import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/** Locale routing for the public site. Admin, API and static files are not localized. */
export default createMiddleware(routing);

export const config = {
  matcher: [
    // Everything except API routes, the admin area, Next.js internals and files with an extension.
    "/((?!api|admin|_next|_vercel|.*\\..*).*)",
  ],
};
