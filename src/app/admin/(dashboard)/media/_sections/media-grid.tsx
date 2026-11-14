import { ImagesIcon, SearchXIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { MediaItem } from "@/features/media/admin-queries";
import { formatBytes } from "@/features/media/format";

/** The library as a grid of cards; each opens the image's page. */
export async function MediaGrid({
  items,
  filtered,
}: {
  items: readonly MediaItem[];
  /** A search or chip is active (changes the empty message). */
  filtered: boolean;
}) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminMedia" });

  if (items.length === 0) {
    const Icon = filtered ? SearchXIcon : ImagesIcon;
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-12 text-center text-muted-foreground">
        <Icon aria-hidden className="size-8" />
        <p className="max-w-sm text-body-sm">{filtered ? t("noResults") : t("empty")}</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`${adminRoutes.media}/${item.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-background/70 transition-[border-color,box-shadow] duration-(--duration-fast) hover:border-primary/60 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="relative aspect-[4/3] w-full bg-muted">
              <Image
                src={item.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
                className="object-cover transition-transform duration-(--duration-base) group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              {item.bundled && (
                <Badge variant="outline" className="absolute top-2 left-2">
                  {t("bundled")}
                </Badge>
              )}
            </span>
            <span className="flex flex-1 flex-col gap-1.5 p-3">
              <span className="truncate text-body-sm font-semibold text-foreground">
                {item.name}
              </span>
              <span className="text-caption text-muted-foreground tabular-nums">
                {item.width} × {item.height}
                {item.sizeBytes !== null && ` · ${formatBytes(item.sizeBytes, adminLocale)}`}
              </span>
              <Badge variant={item.usageCount > 0 ? "success" : "neutral"} className="mt-auto">
                {item.usageCount > 0 ? t("usedCount", { count: item.usageCount }) : t("unused")}
              </Badge>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
