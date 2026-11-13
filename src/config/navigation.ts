import type { AppPathname } from "@/i18n/routing";
import type { Messages } from "next-intl";

/** Keys of the `Nav` message namespace used as link labels. */
type NavLabel = keyof Messages["Nav"];

export type NavItem = { href: AppPathname; label: NavLabel };

/** Primary navigation, in display order (header, mobile menu, footer). */
export const mainNav = [
  { href: "/program", label: "program" },
  { href: "/cek-unit", label: "findUnit" },
  { href: "/kemitraan", label: "partnership" },
  { href: "/blog", label: "blog" },
  { href: "/kontak", label: "contact" },
] as const satisfies readonly NavItem[];

/** Pages aimed at prospective partners; they get partner-focused mobile actions. */
export const partnerPaths = ["/kemitraan"] as const satisfies readonly AppPathname[];

/**
 * Whether a nav item is the current section. `pathname` is the internal (Indonesian) route
 * from `usePathname()` of `@/i18n/navigation`.
 */
export function isActivePath(pathname: string, href: AppPathname): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isPartnerPath(pathname: string): boolean {
  return partnerPaths.some((href) => isActivePath(pathname, href));
}
