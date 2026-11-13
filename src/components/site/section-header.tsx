import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** Id for the heading, referenced by the section's `aria-labelledby`. */
  id: string;
  overline: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  tone?: "default" | "inverse";
  className?: string;
};

/** Overline + H2 + lead, revealed on scroll (DESIGN.md § 4 Section header). */
export function SectionHeader({
  id,
  overline,
  title,
  lead,
  align = "start",
  tone = "default",
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <p
        className={cn(
          "inline-flex items-center gap-2 text-overline uppercase",
          tone === "inverse" ? "text-sunny-300" : "text-partner",
        )}
      >
        <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
        {overline}
      </p>
      <h2
        id={id}
        className={cn(
          "text-h2",
          tone === "inverse" ? "text-inverse-foreground" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "text-body-lg",
            tone === "inverse" ? "text-inverse-muted" : "text-muted-foreground",
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}
