import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Badge } from "@/components/ui/badge";
import { levelTheme } from "@/features/programs/level-theme";
import type { Level } from "@/features/programs/schema";

/**
 * Level comparison from the same level data: a real table from `md` (screen-reader friendly),
 * stacked cards on phones where a 4-column table would not fit.
 */
export async function CompareSection({ levels }: { levels: Level[] }) {
  const t = await getTranslations("Program.compare");

  const rows: { label: string; value: (level: Level) => ReactNode }[] = [
    { label: t("age"), value: (level) => `${level.ageMin}–${level.ageMax}` },
    { label: t("focus"), value: (level) => level.tagline },
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
        <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card md:block">
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr className="bg-surface">
                <th
                  scope="col"
                  className="w-1/5 px-6 py-4 text-overline text-muted-foreground uppercase"
                >
                  {t("feature")}
                </th>
                {levels.map((level) => (
                  <th key={level.slug} scope="col" className="px-6 py-4">
                    <Badge variant={levelTheme[level.slug].badge} className="text-label">
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
                  className="transition-colors duration-(--duration-fast) hover:bg-surface/60"
                >
                  <th scope="row" className="px-6 py-4 text-label text-foreground">
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
              <Badge variant={levelTheme[level.slug].badge} className="text-label">
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
