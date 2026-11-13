import {
  ClockIcon,
  LocateFixedIcon,
  MapPinIcon,
  NavigationIcon,
  UserRoundIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { levelTheme } from "@/features/programs/level-theme";
import type { Locale } from "@/i18n/routing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import type { EnrollmentStatus, UnitSummary } from "../schema";
import { buildDirectionsUrl, formatUnitSchedule, unitInitials } from "../service";

const enrollmentBadge: Record<EnrollmentStatus, NonNullable<BadgeProps["variant"]>> = {
  open: "success",
  limited: "warning",
  full: "destructive",
};

const levelNames = { kindy: "Kindy", intro: "Intro", secondary: "Secondary" } as const;

/** Unit card (DESIGN.md § 4 Card · Unit): identity, status, where/when, levels, and two actions. */
type UnitCardProps = {
  unit: UnitSummary;
  /** Shown as a chip when results are sorted by distance, e.g. "2,4 km". */
  distanceLabel?: string;
};

export async function UnitCard({ unit, distanceLabel }: UnitCardProps) {
  const t = await getTranslations("Units");
  const tWhatsApp = await getTranslations("WhatsApp");
  const locale = (await getLocale()) as Locale;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-card transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-label text-inverse-foreground shadow-glow-primary"
        >
          {unitInitials(unit.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <div className="flex min-w-0 flex-col">
            <h3 className="text-h5 text-foreground">{unit.name}</h3>
            <p className="text-caption text-muted-foreground">{t("code", { code: unit.code })}</p>
          </div>
          <Badge variant={enrollmentBadge[unit.enrollment]} dot>
            {t("enrollment", { status: unit.enrollment })}
          </Badge>
        </div>
      </header>

      {distanceLabel && (
        <p className="-mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-caption font-semibold text-primary">
          <LocateFixedIcon aria-hidden className="size-3.5" />
          {distanceLabel}
        </p>
      )}

      <dl className="flex flex-col gap-2 text-body-sm text-muted-foreground">
        <UnitFact icon={<MapPinIcon aria-hidden />} label={t("address")}>
          {unit.address}
        </UnitFact>
        <UnitFact icon={<UserRoundIcon aria-hidden />} label={t("managerLabel")}>
          {t("manager", { name: unit.manager })}
        </UnitFact>
        <UnitFact icon={<ClockIcon aria-hidden />} label={t("schedule")}>
          {formatUnitSchedule(unit, locale)}
        </UnitFact>
      </dl>

      <ul aria-label={t("levels")} className="flex flex-wrap gap-1.5">
        {unit.levels.map((level) => (
          <li key={level}>
            <Badge variant={levelTheme[level].badge}>{levelNames[level]}</Badge>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid gap-2 pt-1 min-[420px]:grid-cols-2">
        <Button asChild variant="whatsapp" size="sm">
          <a
            href={buildWhatsAppUrl(unit.whatsapp, tWhatsApp("unit", { unit: unit.name }))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BrandIcon name="whatsapp" className="size-4" />
            {t("chat")}
          </a>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a href={buildDirectionsUrl(unit.address)} target="_blank" rel="noopener noreferrer">
            <NavigationIcon aria-hidden />
            {t("directions")}
          </a>
        </Button>
      </div>
    </article>
  );
}

function UnitFact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <dt className="mt-0.5 shrink-0 text-primary [&_svg]:size-4">
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
