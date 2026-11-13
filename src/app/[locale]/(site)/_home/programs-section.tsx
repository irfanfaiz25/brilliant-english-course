import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { LevelCard } from "@/features/programs/components/level-card";
import type { Level } from "@/features/programs/schema";

export async function ProgramsSection({ levels }: { levels: Level[] }) {
  const t = await getTranslations("Home.programs");

  return (
    <Section id="program" aria-labelledby="programs-title" className="scroll-mt-20">
      <DecorBlob tone="partner" className="top-40 -right-40 size-96 opacity-50" />
      <SectionHeader
        id="programs-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />

      <Stagger as="ul" className="mt-12 grid gap-6 md:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
        {levels.map((level) => (
          <StaggerItem key={level.slug} as="li">
            <LevelCard
              level={level}
              ageLabel={t("ageRange", { min: level.ageMin, max: level.ageMax })}
              detailLabel={t("detailLink")}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
