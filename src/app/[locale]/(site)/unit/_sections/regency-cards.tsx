import { ArrowRightIcon, MapPinnedIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { DirectoryRegency } from "@/features/units/directory";
import { Link } from "@/i18n/navigation";

/** Regency/city links with their unit counts (directory and province pages). */
export async function RegencyCards({ regencies }: { regencies: readonly DirectoryRegency[] }) {
  const t = await getTranslations("UnitPages.directory");

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {regencies.map((regency) => (
        <li key={regency.code}>
          <Link
            href={{ pathname: "/unit/[...path]", params: { path: regency.path } }}
            className="group flex h-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card transition-[translate,box-shadow,border-color] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-(--duration-base) ease-out group-hover:scale-110">
              <MapPinnedIcon aria-hidden className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label text-foreground group-hover:text-primary">
                {regency.name}
              </span>
              <span className="text-caption text-muted-foreground">
                {t("unitCount", { count: regency.units.length })}
              </span>
            </span>
            <ArrowRightIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-out group-hover:translate-x-1 group-hover:text-primary"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
