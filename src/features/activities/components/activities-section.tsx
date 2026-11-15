import { getTranslations } from "next-intl/server";

import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { getContactSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import type { Activity } from "../schema";

import { ActivityExplorer } from "./activity-explorer";

type ActivitiesSectionProps = {
  activities: readonly Activity[];
  /** Anchor id (the Program page uses "kegiatan"). */
  id?: string;
  /** On a unit's page: questions go to that unit and "find the nearest unit" is hidden. */
  unit?: { name: string; whatsapp: string };
};

/**
 * Activities: a CSS scroll-snap row on phones (no carousel JS), a grid from `md` up. Each card
 * opens the activity's detail popup (ADR-042). Shared by Home, Program and unit pages.
 */
export async function ActivitiesSection({ activities, id, unit }: ActivitiesSectionProps) {
  const [t, tWhatsApp, contact] = await Promise.all([
    getTranslations("Activities"),
    getTranslations("WhatsApp"),
    getContactSettings(),
  ]);
  const whatsappUrls = Object.fromEntries(
    activities.map((activity) => [
      activity.slug,
      buildWhatsAppUrl(
        unit?.whatsapp ?? contact.whatsapp,
        tWhatsApp("activity", { to: unit?.name ?? "BEC", activity: activity.name }),
      ),
    ]),
  );

  return (
    <Section id={id} aria-labelledby="activities-title" className="scroll-mt-(--header-offset)">
      {/* Warm wash that fades in from the canvas above, so there is no hard section edge. */}
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_75%,transparent)] bg-gradient-warm"
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

      <ActivityExplorer
        activities={activities}
        whatsappUrls={whatsappUrls}
        showFindUnit={!unit}
        openLabel={t("detailLink")}
        detailLabels={{
          photo: t.raw("detail.photo") as string,
          highlights: t("detail.highlights"),
          skills: t("detail.skills"),
          findUnit: t("detail.findUnit"),
          askWhatsApp: t("detail.askWhatsApp"),
        }}
      />
      <p className="mt-2 text-center text-caption text-muted-foreground md:hidden">
        {t("scrollHint")}
      </p>
    </Section>
  );
}
