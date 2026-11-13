import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { ActivityCard } from "@/features/activities/components/activity-card";
import type { Activity } from "@/features/activities/schema";

/**
 * Activities: a CSS scroll-snap row on phones (no carousel JS), a grid from `md` up.
 */
export async function ActivitiesSection({ activities }: { activities: Activity[] }) {
  const t = await getTranslations("Home.activities");

  return (
    <Section tone="warm" aria-labelledby="activities-title">
      <DecorBlob tone="highlight" className="-top-20 -left-24 size-80" />
      <SectionHeader
        id="activities-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />

      <Stagger
        as="ul"
        className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:mt-14 lg:grid-cols-4"
      >
        {activities.map((activity) => (
          <StaggerItem
            key={activity.slug}
            as="li"
            className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto"
          >
            <ActivityCard activity={activity} detailLabel={t("detailLink")} />
          </StaggerItem>
        ))}
      </Stagger>
      <p className="mt-2 text-center text-caption text-muted-foreground md:hidden">
        {t("scrollHint")}
      </p>
    </Section>
  );
}
