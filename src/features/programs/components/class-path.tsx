import { cn } from "@/lib/utils";

import { formatGradeSpan, type GradeLabels } from "../grades";
import { levelTheme } from "../level-theme";
import type { Level } from "../schema";

type ClassPathProps = {
  level: Pick<Level, "theme" | "classes">;
  grades: GradeLabels;
  /** Accessible name of the list, e.g. "Kelas di Kindy Class". */
  label: string;
  className?: string;
};

/**
 * A level's classes as a numbered vertical path (ADR-040): each step names the class, the school
 * years it fits and its focus line, joined by a line in the level's color. A pure view.
 */
export function ClassPath({ level, grades, label, className }: ClassPathProps) {
  const theme = levelTheme[level.theme];
  return (
    <ol aria-label={label} className={cn("flex flex-col", className)}>
      {level.classes.map((item, index) => {
        const last = index === level.classes.length - 1;
        return (
          <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-10 bottom-1 left-5 w-0.5 -translate-x-1/2 rounded-full",
                  theme.bar,
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-label shadow-sm ring-4 ring-background",
                theme.soft,
                theme.accent,
              )}
            >
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-body font-semibold text-foreground">{item.name}</span>
                <span className={cn("text-caption font-semibold", theme.accent)}>
                  {formatGradeSpan(item.gradeFrom, item.gradeTo, grades)}
                </span>
              </div>
              {item.focus && <p className="text-body-sm text-muted-foreground">{item.focus}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
