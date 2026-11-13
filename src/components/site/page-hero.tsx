import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";
import { DecorBlob } from "./decor-blob";
import { Doodle } from "./doodle";

type PageHeroProps = {
  /** Id of the `h1`, referenced by the section's `aria-labelledby`. */
  id: string;
  breadcrumbs: readonly BreadcrumbItem[];
  overline: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Chips or actions under the lead. */
  children?: ReactNode;
  /** `primary` (teal) for inner pages, `foreground` for content-heavy titles. */
  titleTone?: "primary" | "foreground";
  /** Decorative accent color. */
  accent?: "primary" | "partner" | "highlight";
};

/**
 * Header of inner pages: breadcrumb, overline, H1, lead and optional chips, with the soft decor
 * and staggered rise-in used across the site (DESIGN.md § 5.3).
 */
export function PageHero({
  id,
  breadcrumbs,
  overline,
  title,
  lead,
  children,
  titleTone = "primary",
  accent = "primary",
}: PageHeroProps) {
  return (
    <section aria-labelledby={id} className="relative isolate overflow-x-clip">
      <DecorBlob tone={accent} className="parallax-strong -top-10 -right-24 size-80" />
      <Doodle
        shape="squiggle"
        tone={accent === "partner" ? "primary" : "partner"}
        className="parallax-soft top-16 right-[20%] hidden w-16 md:block"
      />

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-5 pt-8 pb-6 md:px-8 md:pt-12 lg:pb-8">
        <Breadcrumbs items={breadcrumbs} className="animate-rise-in" />
        <p className="inline-flex animate-rise-in items-center gap-2 text-overline text-partner uppercase [animation-delay:90ms]">
          <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
          {overline}
        </p>
        <h1
          id={id}
          className={cn("text-h1", titleTone === "primary" ? "text-primary" : "text-foreground")}
        >
          {title}
        </h1>
        {lead && (
          <p className="max-w-3xl animate-lift-in text-body-lg text-muted-foreground [animation-delay:180ms]">
            {lead}
          </p>
        )}
        {children && (
          <div className="flex animate-rise-in flex-wrap items-center gap-2 [animation-delay:270ms]">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/** Small fact chip for `PageHero` children. */
export function HeroChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-caption whitespace-nowrap text-muted-foreground shadow-sm [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-primary">
      {icon}
      {children}
    </span>
  );
}
