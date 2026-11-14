import {
  ClockIcon,
  LocateFixedIcon,
  MapPinIcon,
  NavigationIcon,
  UserRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { levelTheme } from "@/features/programs/level-theme";
import { Link } from "@/i18n/navigation";

import type { EnrollmentStatus, UnitSummary } from "../schema";
import { buildDirectionsUrl, unitInitials } from "../service";

const enrollmentBadge: Record<EnrollmentStatus, NonNullable<BadgeProps["variant"]>> = {
  open: "success",
  limited: "warning",
  full: "destructive",
};

const levelNames = { kindy: "Kindy", intro: "Intro", secondary: "Secondary" } as const;

/** Every text of the card, already translated and filled in for one unit. */
export type UnitCardText = {
  code: string;
  enrollment: string;
  manager: string;
  schedule: string;
  whatsappUrl: string;
  labels: {
    address: string;
    manager: string;
    schedule: string;
    levels: string;
    chat: string;
    directions: string;
  };
};

type UnitCardViewProps = {
  unit: UnitSummary;
  text: UnitCardText;
  /** Shown as a chip when results are sorted by distance, e.g. "2,4 km". */
  distanceLabel?: string;
  /** Page path under `/unit` (province, regency, unit); the name links to it. */
  path?: readonly string[];
};

/**
 * Unit card (DESIGN.md § 4 Card · Unit): identity, status, where/when, levels, and two actions.
 * Pure markup so the admin can preview it live; `UnitCard` fills the texts on the server.
 */
export function UnitCardView({ unit, text, distanceLabel, path }: UnitCardViewProps) {
  return (
    <article className="@container flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-card transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-label text-inverse-foreground shadow-glow-primary"
        >
          {unitInitials(unit.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <div className="flex min-w-0 flex-col">
            <h3 className="text-h5 text-foreground">
              {path ? (
                <Link
                  href={{ pathname: "/unit/[...path]", params: { path: [...path] } }}
                  className="rounded-sm underline decoration-primary/30 underline-offset-4 transition-colors duration-(--duration-fast) hover:text-primary hover:decoration-primary"
                >
                  {unit.name}
                </Link>
              ) : (
                unit.name
              )}
            </h3>
            <p className="text-caption text-muted-foreground">{text.code}</p>
          </div>
          <Badge variant={enrollmentBadge[unit.enrollment]} dot>
            {text.enrollment}
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
        <UnitFact icon={<MapPinIcon aria-hidden />} label={text.labels.address}>
          {unit.address}
        </UnitFact>
        <UnitFact icon={<UserRoundIcon aria-hidden />} label={text.labels.manager}>
          {text.manager}
        </UnitFact>
        <UnitFact icon={<ClockIcon aria-hidden />} label={text.labels.schedule}>
          {text.schedule}
        </UnitFact>
      </dl>

      <ul aria-label={text.labels.levels} className="flex flex-wrap gap-1.5">
        {unit.levels.map((level) => (
          <li key={level}>
            <Badge variant={levelTheme[level].badge}>{levelNames[level]}</Badge>
          </li>
        ))}
      </ul>

      {/* Side by side once the card itself is wide enough (also inside the admin preview). */}
      <div className="mt-auto grid gap-2 pt-1 @xs:grid-cols-2">
        <Button asChild variant="whatsapp" size="sm">
          <a href={text.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <BrandIcon name="whatsapp" className="size-4" />
            {text.labels.chat}
          </a>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a href={buildDirectionsUrl(unit.address)} target="_blank" rel="noopener noreferrer">
            <NavigationIcon aria-hidden />
            {text.labels.directions}
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
