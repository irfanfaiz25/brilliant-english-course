import { ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdminIcon } from "@/components/admin/admin-icon";
import { adminNavigation } from "@/config/admin-navigation";
import { adminLocale } from "@/config/admin-routes";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";

/** Links to the modules this user may open (everything except the overview itself). */
export async function Shortcuts({ user }: { user: SessionUser }) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  const items = adminNavigation
    .flatMap((group) => group.items)
    .filter((item) => item.key !== "overview" && can(user, "read", item.resource));
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="shortcuts"
      className="flex flex-col gap-4 rounded-2xl surface-glass-panel p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="shortcuts" className="text-h4 text-foreground">
          {t("overview.shortcuts")}
        </h2>
        <p className="text-body-sm text-muted-foreground">{t("overview.shortcutsDescription")}</p>
      </div>
      <ul className="grid gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="group flex min-h-11 items-center gap-3 rounded-lg px-2 text-label text-foreground transition-colors duration-(--duration-fast) hover:bg-white/70"
            >
              <AdminIcon name={item.icon} className="size-5 text-primary" />
              <span className="flex-1">{t(`nav.items.${item.key}`)}</span>
              <ChevronRightIcon
                aria-hidden
                className="size-4 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
