import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { adminRoutes } from "@/config/admin-routes";
import { auth } from "@/lib/auth";
import { can, type PermissionAction, type Resource, type ScopedResource } from "@/lib/permissions";

import type { SessionUser, UserRole } from "./schema";

/**
 * Session data access layer (Next.js "DAL" pattern, ADR-025). Pages, Server Actions and Route
 * Handlers ask here; the proxy's cookie check is only a fast redirect, never the authorization.
 *
 * Reads request headers, so callers render behind `<Suspense>` (Cache Components). Memoized per
 * request with React `cache`, so several components can ask without extra database reads.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  // Deactivated after signing in: treat as signed out right away.
  if (user.isActive === false) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    unitId: user.unitId ?? null,
  };
});

/** The signed-in user, or a redirect to the sign-in page that returns to `returnTo`. */
export async function requireUser(returnTo: string = adminRoutes.home): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${adminRoutes.signIn}?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * The signed-in user if allowed to `action` the `target`; otherwise the page renders as not found,
 * so a missing permission does not reveal that the page exists.
 */
export async function requirePermission(
  action: PermissionAction,
  target: Resource | ScopedResource,
  returnTo?: string,
): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!can(user, action, target)) notFound();
  return user;
}
