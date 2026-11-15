import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Badge } from "@/components/ui/badge";
import { levelTheme } from "@/features/programs/level-theme";
import type { Level } from "@/features/programs/schema";
import { cn } from "@/lib/utils";

/** Beyond this many levels the table keeps readable columns and scrolls sideways. */
const fitColumns = 3;

/**
 * Level comparison from the same level data: a real table from `md` (screen-reader friendly),
 * stacked cards on phones where a 4-column table would not fit. With more than three levels the
 * table scrolls sideways (a focusable region) and the feature column stays pinned on the left.
 */
export async function CompareSection({ levels }: { levels: Level[] }) {
  const [t, format] = await Promise.all([getTranslations("Program.compare"), getFormatter()]);
  const scrolls = levels.length > fitColumns;
  // "Kindy, Intro, dan Secondary" / "Kindy, Intro and Secondary", whatever the number of levels.
  const caption = t("caption", {
    levels: format.list(
      levels.map((level) => level.name),
      { type: "conjunction" },
    ),
  });
  // Pinned cells need their own background and an edge that columns slide under.
  const pinned = scrolls && "sticky left-0 z-10 border-r border-border/60";

  const rows: { label: string; value: (level: Level) => ReactNode }[] = [
    { label: t("age"), value: (level) => `${level.ageMin}–${level.ageMax}` },
    { label: t("focus"), value: (level) => level.tagline },
    {
      label: t("classes"),
      value: (level) =>
        level.classes.length > 0 ? level.classes.map((item) => item.name).join(" → ") : "—",
    },
    {
      label: t("sessions"),
      value: (level) => t("sessionsValue", { count: level.sessionsPerWeek }),
    },
    {
      label: t("classSize"),
      value: (level) => t("classSizeValue", { count: level.maxStudentsPerClass }),
    },
    { label: t("topics"), value: (level) => level.skills.join(" · ") },
  ];

  return (
    <Section aria-labelledby="compare-title">
      <SectionHeader
        id="compare-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />

      <Reveal className="mt-10 lg:mt-12">
        <div
          role={scrolls ? "region" : undefined}
          aria-label={scrolls ? caption : undefined}
          tabIndex={scrolls ? 0 : undefined}
          className={cn(
            "hidden rounded-2xl border border-border/60 bg-card shadow-card md:block",
            scrolls
              ? "overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              : "overflow-hidden",
          )}
        >
          <table className={cn("table-fixed text-left", scrolls ? "w-max min-w-full" : "w-full")}>
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="bg-surface">
                <th
                  scope="col"
                  className={cn(
                    "bg-surface px-6 py-4 text-overline text-muted-foreground uppercase",
                    scrolls ? "w-44" : "w-1/5",
                    pinned,
                  )}
                >
                  {t("feature")}
                </th>
                {levels.map((level) => (
                  <th key={level.slug} scope="col" className={cn("px-6 py-4", scrolls && "w-60")}>
                    <Badge variant={levelTheme[level.theme].badge} className="text-label">
                      {level.name}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr
                  key={row.label}
                  // No row highlight while scrolling: the pinned cell could not follow it.
                  className={cn(
                    !scrolls && "transition-colors duration-(--duration-fast) hover:bg-surface/60",
                  )}
                >
                  <th
                    scope="row"
                    className={cn("bg-card px-6 py-4 text-label text-foreground", pinned)}
                  >
                    {row.label}
                  </th>
                  {levels.map((level) => (
                    <td key={level.slug} className="px-6 py-4 text-body-sm text-muted-foreground">
                      {row.value(level)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="grid gap-4 md:hidden">
          {levels.map((level) => (
            <li
              key={level.slug}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
            >
              <Badge variant={levelTheme[level.theme].badge} className="text-label">
                {level.name}
              </Badge>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-body-sm">
                {rows.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-label text-foreground">{row.label}</dt>
                    <dd className="text-muted-foreground">{row.value(level)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
