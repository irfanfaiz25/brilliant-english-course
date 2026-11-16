import {
  CheckIcon,
  ClockIcon,
  LocateFixedIcon,
  MapPinIcon,
  MinusIcon,
  NavigationIcon,
  UserRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { levelTheme } from "@/features/programs/level-theme";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { EnrollmentStatus, UnitSummary } from "../schema";
import { buildDirectionsUrl, unitInitials, type LevelSlot } from "../service";

const enrollmentBadge: Record<EnrollmentStatus, NonNullable<BadgeProps["variant"]>> = {
  open: "success",
  limited: "warning",
  full: "destructive",
};

/** Every text of the card, already translated and filled in for one unit. */
export type UnitCardText = {
  code: string;
  enrollment: string;
  manager: string;
  schedule: string;
  whatsappUrl: string;
  /** Every site level in display order, marked with what the unit opens (`buildLevelSlots`). */
  levelSlots: readonly LevelSlot[];
  labels: {
    address: string;
    manager: string;
    schedule: string;
    levels: string;
    levelNotOffered: string;
    levelPartial: string;
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
 * Unit card (DESIGN.md § 4 Card · Unit). A fixed frame so cards line up in a grid: identity with
 * the status pinned top right, where/when (address up to two lines), one slot per program level
 * (offered, partly offered or not, so units compare at a glance), and the two actions at the
 * bottom. Pure markup so the admin can preview it live; `UnitCard` fills the texts on the server.
 */
export function UnitCardView({ unit, text, distanceLabel, path }: UnitCardViewProps) {
  return (
    <article className="@container flex h-full flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-card transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      {/* Wide card: avatar | name | status, the code spanning name and status below. Narrow card:
          the status moves under the code so the name keeps its width. */}
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 @xs:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span
          aria-hidden
          className="col-start-1 row-span-3 row-start-1 inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-label text-inverse-foreground shadow-glow-primary @xs:row-span-2"
        >
          {unitInitials(unit.name)}
        </span>
        <h3
          className="col-start-2 row-start-1 line-clamp-2 text-h5 text-foreground"
          title={unit.name}
        >
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
        <Badge
          variant={enrollmentBadge[unit.enrollment]}
          dot
          className="col-start-2 row-start-3 mt-1 justify-self-start whitespace-nowrap @xs:col-start-3 @xs:row-start-1 @xs:mt-0"
        >
          {text.enrollment}
        </Badge>
        <p className="col-start-2 row-start-2 text-caption text-muted-foreground @xs:col-end-4">
          {text.code}
        </p>
      </header>

      {distanceLabel && (
        <p className="-mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-caption font-semibold text-primary">
          <LocateFixedIcon aria-hidden className="size-3.5" />
          {distanceLabel}
        </p>
      )}

      <dl className="flex flex-col gap-2 text-body-sm text-muted-foreground">
        <UnitFact icon={<MapPinIcon aria-hidden />} label={text.labels.address}>
          <span className="line-clamp-2" title={unit.address}>
            {unit.address}
          </span>
        </UnitFact>
        <UnitFact icon={<ClockIcon aria-hidden />} label={text.labels.schedule}>
          {text.schedule}
        </UnitFact>
        <UnitFact icon={<UserRoundIcon aria-hidden />} label={text.labels.manager}>
          {text.manager}
        </UnitFact>
      </dl>

      <section aria-label={text.labels.levels} className="flex flex-col gap-2">
        <p aria-hidden className="text-overline text-muted-foreground uppercase">
          {text.labels.levels}
        </p>
        <ul className="grid auto-cols-fr grid-flow-col gap-1.5">
          {text.levelSlots.map((level) => (
            <LevelSlotItem key={level.slug} level={level} labels={text.labels} />
          ))}
        </ul>
      </section>

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

/** A level slot: the level's colours with a tick when offered, muted with a dash when not. */
function LevelSlotItem({ level, labels }: { level: LevelSlot; labels: UnitCardText["labels"] }) {
  const theme = levelTheme[level.theme];
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-2 text-center",
        level.offered ? theme.soft : "bg-muted/60",
      )}
    >
      <span
        className={cn(
          // Icon above the name in a narrow card, beside it once there is room.
          "inline-flex flex-col items-center gap-0.5 text-caption font-semibold @xs:flex-row @xs:gap-1",
          level.offered ? theme.accent : "text-muted-foreground",
        )}
      >
        {level.offered ? (
          <CheckIcon aria-hidden className="size-3.5 shrink-0" />
        ) : (
          <MinusIcon aria-hidden className="size-3.5 shrink-0" />
        )}
        <span className="line-clamp-2">{level.name}</span>
      </span>
      {level.partial && (
        <span className="text-caption leading-tight font-normal text-muted-foreground">
          {labels.levelPartial}
        </span>
      )}
      {!level.offered && <span className="sr-only">{labels.levelNotOffered}</span>}
    </li>
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
