import { ArrowDownIcon, MapPinIcon, MapPinnedIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuotaStatus, VillageQuota } from "@/features/quota/schema";
import type { Region } from "@/features/regions/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const BADGE_VARIANT = {
  available: "success",
  almostFull: "warning",
  full: "destructive",
} as const satisfies Record<QuotaStatus, string>;

const FILLED_SLOT = {
  available: "bg-primary",
  almostFull: "bg-warning",
  full: "bg-destructive",
} as const satisfies Record<QuotaStatus, string>;

type QuotaResultProps =
  { village: null; max: number } | { village: Region; area: string; quota: VillageQuota };

/**
 * Quota of the chosen village: status badge (text + color), a slot meter and the next step.
 * Render it keyed by village code so the card rises in again whenever the village changes.
 */
export async function QuotaResult(props: QuotaResultProps) {
  const t = await getTranslations("Partnership.quota");

  if (props.village === null) {
    return (
      <div className="flex animate-rise-in items-start gap-4 rounded-2xl border border-dashed border-border bg-surface/60 p-5">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-partner-soft text-partner">
          <MapPinnedIcon aria-hidden className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-h5 text-foreground">{t("chooseTitle")}</p>
          <p className="text-body-sm text-muted-foreground">
            {t("chooseText", { max: props.max })}
          </p>
        </div>
      </div>
    );
  }

  const { village, area, quota } = props;
  const used = quota.max - quota.remaining;
  const message =
    quota.status === "full"
      ? t("fullText", { village: village.name })
      : quota.status === "almostFull"
        ? t("almostFullText", { village: village.name, remaining: quota.remaining })
        : t("availableText", { village: village.name });

  return (
    <article
      aria-labelledby="quota-village"
      className={cn(
        "flex animate-rise-in flex-col gap-5 rounded-2xl border p-5 shadow-card",
        quota.status === "full"
          ? "border-destructive/30 bg-destructive-soft/40"
          : "border-primary/25 bg-primary-soft/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id="quota-village" className="text-h4 text-foreground">
            {village.name}
          </h3>
          <p className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
            <MapPinIcon aria-hidden className="size-4 shrink-0" />
            {area}
          </p>
        </div>
        <Badge variant={BADGE_VARIANT[quota.status]} dot>
          {t(quota.status, { remaining: quota.remaining })}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={quota.max}
          aria-valuenow={used}
          aria-label={t("meterLabel", { used, max: quota.max })}
          className="flex gap-1.5"
        >
          {Array.from({ length: quota.max }, (_, index) => (
            <span
              key={index}
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-background ring-1 ring-border/70"
            >
              {index < used && (
                <span
                  className={cn(
                    "block h-full origin-left animate-grow-x rounded-full",
                    FILLED_SLOT[quota.status],
                  )}
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              )}
            </span>
          ))}
        </div>
        <p className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-caption text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t("slots", { remaining: quota.remaining, max: quota.max })}
          </span>
          <span>
            {t("activeUnits", { count: quota.activeUnits })}
            {quota.reserved > 0 && ` · ${t("reserved", { count: quota.reserved })}`}
          </span>
        </p>
      </div>

      <p className="text-body-sm text-foreground">{message}</p>

      <div className="flex flex-col gap-2">
        {quota.status !== "full" && (
          <Button asChild variant="partner">
            <a href="#daftar">
              {t("applyCta")}
              <ArrowDownIcon aria-hidden />
            </a>
          </Button>
        )}
        {quota.activeUnits > 0 && (
          <Button asChild variant="secondary">
            <Link href={{ pathname: "/cek-unit", query: { wilayah: village.code } }}>
              {t("seeUnits", { village: village.name })}
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
