import type { Resource } from "@/lib/permissions";

import { adminRoutes } from "./admin-routes";

/** Icon names the admin navigation can show (mapped to Lucide icons in `components/admin`). */
export type AdminIcon =
  | "overview"
  | "leads"
  | "units"
  | "quota"
  | "programs"
  | "activities"
  | "blog"
  | "testimonials"
  | "faq"
  | "media"
  | "users"
  | "settings"
  | "seo";

export type AdminNavItem = {
  /** Key of the label in `AdminNav.items` and of the module placeholder. */
  key: AdminIcon;
  href: string;
  icon: AdminIcon;
  /** Shown only to users who may `read` this resource (`src/lib/permissions.ts`). */
  resource: Resource;
  /** Roadmap sub-phase that builds the module; absent once the module exists. */
  phase?: string;
};

export type AdminNavGroup = {
  key: "main" | "partnership" | "content" | "system";
  items: AdminNavItem[];
};

/**
 * Admin sidebar, grouped like the Penpot `02 · Dashboard` direction (DESIGN.md § 6). URL segments
 * are Indonesian like the rest of the admin. Each module page replaces its placeholder in Phase 4.
 */
export const adminNavigation: readonly AdminNavGroup[] = [
  {
    key: "main",
    items: [{ key: "overview", href: adminRoutes.home, icon: "overview", resource: "dashboard" }],
  },
  {
    key: "partnership",
    items: [
      { key: "leads", href: "/admin/calon-mitra", icon: "leads", resource: "leads", phase: "4d" },
      { key: "units", href: "/admin/unit", icon: "units", resource: "units", phase: "4c" },
      { key: "quota", href: "/admin/kuota", icon: "quota", resource: "quota", phase: "4c" },
    ],
  },
  {
    key: "content",
    items: [
      { key: "programs", href: adminRoutes.programs, icon: "programs", resource: "programs" },
      {
        key: "activities",
        href: adminRoutes.activities,
        icon: "activities",
        resource: "activities",
      },
      { key: "blog", href: "/admin/blog", icon: "blog", resource: "blog", phase: "4e" },
      {
        key: "testimonials",
        href: "/admin/testimoni",
        icon: "testimonials",
        resource: "testimonials",
        phase: "4f",
      },
      { key: "faq", href: "/admin/faq", icon: "faq", resource: "faq", phase: "4f" },
      { key: "media", href: "/admin/media", icon: "media", resource: "media", phase: "4e" },
    ],
  },
  {
    key: "system",
    items: [
      { key: "users", href: "/admin/pengguna", icon: "users", resource: "users", phase: "4g" },
      { key: "settings", href: adminRoutes.settings, icon: "settings", resource: "settings" },
      { key: "seo", href: adminRoutes.seo, icon: "seo", resource: "seo" },
    ],
  },
];

/** Module pages that are still placeholders, by URL segment ("calon-mitra" → its nav item). */
export const plannedAdminModules: ReadonlyMap<string, AdminNavItem> = new Map(
  adminNavigation
    .flatMap((group) => group.items)
    .filter((item) => item.phase !== undefined)
    .map((item) => [item.href.slice(`${adminRoutes.home}/`.length), item]),
);

/** The nav item a path belongs to (longest matching prefix), for the active state and title. */
export function activeAdminItem(pathname: string): AdminNavItem | undefined {
  const items = adminNavigation.flatMap((group) => group.items);
  return items
    .filter((item) =>
      item.href === adminRoutes.home
        ? pathname === adminRoutes.home
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}
