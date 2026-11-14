/**
 * Staff area paths. The admin area is Indonesian and not localized by URL (ADR-005), so these are
 * plain strings shared by the proxy, the auth pages and the session guard.
 */
export const adminRoutes = {
  home: "/admin",
  signIn: "/admin/masuk",
  forgotPassword: "/admin/lupa-password",
  resetPassword: "/admin/reset-password",
  units: "/admin/unit",
  newUnit: "/admin/unit/baru",
  quota: "/admin/kuota",
  programs: "/admin/program",
  activities: "/admin/kegiatan",
  newActivity: "/admin/kegiatan/baru",
  settings: "/admin/pengaturan",
  seo: "/admin/seo",
} as const;

/** Admin pages reachable without a session. */
export const publicAdminPaths: readonly string[] = [
  adminRoutes.signIn,
  adminRoutes.forgotPassword,
  adminRoutes.resetPassword,
];

/** Locale of the admin UI; passed explicitly because admin routes have no `[locale]` segment. */
export const adminLocale = "id" as const;

/**
 * Where to go after signing in: only same-site admin paths are accepted, so a crafted `next`
 * parameter cannot redirect to another site (`//evil.com`, `https://…`) or back to the form.
 */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//")) return adminRoutes.home;
  if (/[\\\s]/.test(next)) return adminRoutes.home;
  const path = next.split(/[?#]/)[0] ?? "";
  if (path !== "/admin" && !path.startsWith("/admin/")) return adminRoutes.home;
  return publicAdminPaths.includes(path) ? adminRoutes.home : next;
}
