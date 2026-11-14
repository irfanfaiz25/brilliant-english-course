"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { activeAdminItem, type AdminIcon as AdminIconName } from "@/config/admin-navigation";
import { cn } from "@/lib/utils";

import { AdminIcon } from "./admin-icon";

export type AdminNavLink = {
  key: AdminIconName;
  href: string;
  icon: AdminIconName;
  label: string;
};

export type AdminNavSection = { key: string; label: string; items: AdminNavLink[] };

type AdminNavProps = {
  sections: readonly AdminNavSection[];
  /**
   * `rail`: the desktop sidebar — icons only at `lg`, icons and labels from `xl`.
   * `sheet`: the mobile sheet — always labelled.
   */
  variant: "rail" | "sheet";
  /** Called after a link is chosen (closes the mobile sheet). */
  onNavigate?: () => void;
};

/**
 * Admin navigation, already filtered by the user's permissions on the server. Marks the current
 * module with `aria-current="page"`; in the icon rail the label stays available to screen readers
 * and as a tooltip.
 */
export function AdminNav({ sections, variant, onNavigate }: AdminNavProps) {
  const pathname = usePathname();
  const active = activeAdminItem(pathname);
  const rail = variant === "rail";

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-1">
          <p
            className={cn(
              "px-3 pb-1 text-overline text-muted-foreground uppercase",
              rail && "sr-only xl:not-sr-only",
            )}
          >
            {section.label}
          </p>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const current = active?.key === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    title={rail ? item.label : undefined}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-label text-muted-foreground",
                      "transition-[background-color,color,box-shadow] duration-(--duration-fast) ease-out",
                      "hover:bg-white/70 hover:text-foreground",
                      "aria-[current=page]:bg-white aria-[current=page]:text-primary aria-[current=page]:shadow-sm",
                      rail && "justify-center xl:justify-start",
                    )}
                  >
                    <AdminIcon
                      name={item.icon}
                      className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground group-aria-[current=page]:text-primary"
                    />
                    <span className={cn("flex-1 truncate", rail && "sr-only xl:not-sr-only")}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
