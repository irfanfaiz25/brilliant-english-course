import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
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
    <Section aria-labelledby="activities-title">
      {/* Warm wash that fades in from the canvas above, so there is no hard section edge. */}
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_35%)] bg-gradient-warm"
      />
      <DecorBlob tone="highlight" className="parallax-strong -top-20 -left-24 size-80" />
      <DecorBlob tone="primary" className="parallax-soft right-0 bottom-0 size-96 opacity-40" />
      <Doodle
        shape="blob"
        tone="soft"
        className="parallax-soft top-16 right-[8%] hidden size-24 md:block"
      />
      <Doodle
        shape="dots"
        tone="partner"
        className="parallax-strong top-24 right-[14%] hidden size-14 opacity-70 md:block"
      />
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
