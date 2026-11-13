import { GraduationCapIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { ChatPreview, PlacementPreview, SearchPreview } from "./steps-previews";
import { StepsShowcase, type ShowcaseStep } from "./steps-showcase";

/** How to join: an interactive stepper with a live preview of each step. */
export async function StepsSection() {
  const t = await getTranslations("Home.steps");
  const mock = await getTranslations("Home.steps.mock");

  const steps: ShowcaseStep[] = [
    {
      label: mock("stepLabel", { n: 1 }),
      title: t("step1Title"),
      text: t("step1Text"),
      icon: <MapPinIcon aria-hidden />,
      tone: "bg-level-intro text-primary-foreground shadow-glow-primary",
      preview: (
        <SearchPreview
          query={mock("searchValue")}
          count={mock("resultsCount")}
          name={mock("resultName")}
          meta={mock("resultMeta")}
          status={mock("resultStatus")}
        />
      ),
    },
    {
      label: mock("stepLabel", { n: 2 }),
      title: t("step2Title"),
      text: t("step2Text"),
      icon: <MessageCircleIcon aria-hidden />,
      tone: "bg-level-secondary text-partner-foreground shadow-glow-partner",
      preview: (
        <ChatPreview
          name={mock("chatName")}
          status={mock("chatStatus")}
          parent={mock("chatParent")}
          admin={mock("chatAdmin")}
          time={mock("chatTime")}
        />
      ),
    },
    {
      label: mock("stepLabel", { n: 3 }),
      title: t("step3Title"),
      text: t("step3Text"),
      icon: <GraduationCapIcon aria-hidden />,
      tone: "bg-level-kindy text-highlight-foreground shadow-lg",
      preview: (
        <PlacementPreview
          title={mock("placementTitle")}
          skills={[
            { label: mock("skillSpeaking"), percent: 78 },
            { label: mock("skillVocabulary"), percent: 70 },
            { label: mock("skillListening"), percent: 84 },
          ]}
          level={mock("placementLevel")}
          start={mock("placementStart")}
        />
      ),
    },
  ];

  return (
    <Section aria-labelledby="steps-title">
      <DecorBlob tone="highlight" className="parallax-soft top-1/3 -left-32 size-96 opacity-60" />
      <Doodle
        shape="squiggle"
        tone="highlight"
        className="parallax-soft top-24 right-[10%] hidden w-16 md:block"
      />
      <Doodle
        shape="plus"
        tone="partner"
        className="bottom-20 left-[8%] hidden size-7 animate-float md:block"
      />

      <SectionHeader
        id="steps-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />

      <Reveal className="mt-12 lg:mt-16">
        <StepsShowcase steps={steps} tabsLabel={mock("tabsLabel")} />
      </Reveal>

      <div className="mt-12 flex justify-center">
        <Button asChild size="lg" pop>
          <Link href="/cek-unit">
            <MapPinIcon aria-hidden />
            {t("cta")}
          </Link>
        </Button>
      </div>
    </Section>
  );
}
