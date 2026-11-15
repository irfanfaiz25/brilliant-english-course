import { getLocale, getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { ScrollRail } from "@/components/site/scroll-rail";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { LevelCard } from "@/features/programs/components/level-card";
import { gradeLabelsFor } from "@/features/programs/grade-labels";
import { formatGradeSpan, gradeSpanOf } from "@/features/programs/grades";
import type { Level } from "@/features/programs/schema";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** From this many levels the cards scroll in a row (from `md`) instead of wrapping. */
const railFrom = 5;

/** Grid columns per level count, so a short list stays centered and balanced. */
const gridColumns: Record<number, string> = {
  1: "md:mx-auto md:max-w-md",
  2: "md:mx-auto md:max-w-4xl md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

/**
 * Program levels on Home. One to four levels sit in a balanced grid; five or more scroll in a
 * `ScrollRail` from `md` (phones keep the stacked list, ADR-038).
 */
export async function ProgramsSection({ levels }: { levels: Level[] }) {
  const t = await getTranslations("Home.programs");
  const grades = await gradeLabelsFor((await getLocale()) as Locale);
  const card = (level: Level) => {
    const span = gradeSpanOf(level.classes);
    return (
      <LevelCard
        level={level}
        ageLabel={t("ageRange", { min: level.ageMin, max: level.ageMax })}
        detailLabel={t("detailLink")}
        classesLabel={t("classesLabel")}
        gradeLabel={span ? formatGradeSpan(span.from, span.to, grades) : undefined}
      />
    );
  };

  return (
    <Section id="program" aria-labelledby="programs-title" className="scroll-mt-20">
      <DecorBlob tone="partner" className="parallax-strong top-40 -right-40 size-96 opacity-50" />
      <DecorBlob tone="primary" className="parallax-soft bottom-0 -left-40 size-96 opacity-40" />
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-dots [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-60"
      />
      <Doodle
        shape="ring"
        tone="partner"
        className="parallax-strong top-28 left-[10%] hidden size-9 md:block"
      />
      <Doodle
        shape="squiggle"
        tone="primary"
        className="parallax-soft top-40 right-[12%] hidden w-16 md:block"
      />
      <Doodle shape="plus" tone="highlight" className="bottom-24 left-[46%] size-7 animate-float" />
      <SectionHeader
        id="programs-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />

      {levels.length >= railFrom ? (
        <Reveal className="mt-12 lg:mt-16">
          {/* Padding keeps the hover lift and halo of a card inside the scrolling row. */}
          <ScrollRail
            label={t("railLabel")}
            labels={{ previous: t("previous"), next: t("next") }}
            className="grid gap-6 md:-mx-3 md:scroll-px-3 md:px-3 md:pt-3 md:pb-8"
          >
            {levels.map((level) => (
              <li
                key={level.slug}
                className="md:w-[calc((100%-1.5rem)/2.2)] md:shrink-0 md:snap-start lg:w-[calc((100%-3rem)/3.2)]"
              >
                {card(level)}
              </li>
            ))}
          </ScrollRail>
        </Reveal>
      ) : (
        <Stagger
          as="ul"
          className={cn("mt-12 grid gap-6 lg:mt-16 lg:gap-8", gridColumns[levels.length])}
        >
          {levels.map((level) => (
            <StaggerItem key={level.slug} as="li">
              {card(level)}
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}
