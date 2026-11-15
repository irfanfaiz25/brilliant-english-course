import { ChevronRightIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { levelTheme } from "../level-theme";
import type { Level } from "../schema";

type LearningPathProps = {
  levels: readonly Pick<Level, "slug" | "name" | "theme" | "classes">[];
  /** Accessible name of the path, e.g. "Jalur belajar BEC". */
  label: string;
  className?: string;
};

/**
 * Every class in teaching order, grouped by level (ADR-040): one glance shows where a child
 * starts and where they go next. Each group links to its level section (`#<slug>`). Levels
 * without classes are left out.
 */
export function LearningPath({ levels, label, className }: LearningPathProps) {
  const groups = levels.filter((level) => level.classes.length > 0);
  if (groups.length === 0) return null;
  return (
    <ol
      aria-label={label}
      className={cn("flex flex-col gap-3 lg:flex-row lg:flex-wrap", className)}
    >
      {groups.map((level) => {
        const theme = levelTheme[level.theme];
        return (
          <li key={level.slug} className="flex min-w-0 flex-col gap-2 lg:flex-1">
            <Link
              href={{ pathname: "/program", hash: level.slug }}
              className={cn(
                "inline-flex w-fit items-center gap-1 rounded-md text-label underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                theme.accent,
              )}
            >
              {level.name}
            </Link>
            <ol className="flex w-fit max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-border/60 bg-card/80 p-2 shadow-sm lg:w-full">
              {level.classes.map((item, index) => (
                <li key={item.id} className="inline-flex items-center gap-1.5">
                  {index > 0 && (
                    <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "rounded-full px-3 py-1.5 text-body-sm font-semibold",
                      theme.soft,
                      theme.accent,
                    )}
                  >
                    {item.name}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
