"use client";

import type { ComponentProps } from "react";

import { isActivePath, type NavItem } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: NavItem["href"];
  variant?: "header" | "menu";
};

const variants = {
  header: cn(
    "relative rounded-full px-4 py-2 text-label text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground",
    // Active indicator: a short brand underline that grows in.
    "after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-(--duration-base) after:ease-out",
    "hover:after:scale-x-50 aria-[current=page]:text-primary aria-[current=page]:after:scale-x-100",
  ),
  menu: cn(
    "flex min-h-14 items-center justify-between rounded-lg px-4 text-h5 text-foreground transition-colors duration-(--duration-fast) hover:bg-muted",
    "aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary",
  ),
} as const;

/** Site navigation link that marks the current section with `aria-current="page"`. */
export function NavLink({ href, variant = "header", className, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(variants[variant], className)}
      {...props}
    />
  );
}
