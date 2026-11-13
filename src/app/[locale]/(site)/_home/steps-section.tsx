import { GraduationCapIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const stepStyles = [
  { icon: MapPinIcon, tone: "bg-level-intro text-primary-foreground shadow-glow-primary" },
  {
    icon: MessageCircleIcon,
    tone: "bg-level-secondary text-partner-foreground shadow-glow-partner",
  },
  { icon: GraduationCapIcon, tone: "bg-level-kindy text-highlight-foreground shadow-lg" },
] as const;

/** How to join: three numbered steps joined by a dashed path (horizontal on desktop, vertical on phones). */
export async function StepsSection() {
  const t = await getTranslations("Home.steps");
  const steps = [
    { title: t("step1Title"), text: t("step1Text") },
    { title: t("step2Title"), text: t("step2Text") },
    { title: t("step3Title"), text: t("step3Text") },
  ];

  return (
    <Section aria-labelledby="steps-title">
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

      <div className="relative mt-12 lg:mt-16">
        {/* Dashed path behind the step markers. */}
        <span
          aria-hidden
          className="absolute top-8 bottom-28 left-8 w-0 border-l-2 border-dashed border-teal-200 md:inset-x-[16%] md:top-8 md:bottom-auto md:h-0 md:w-auto md:border-t-2 md:border-l-0"
        />
        <Stagger as="ol" className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => {
            const { icon: Icon, tone } = stepStyles[index] ?? stepStyles[0];
            return (
              <StaggerItem
                key={step.title}
                as="li"
                className="flex gap-5 md:flex-col md:items-center md:text-center"
              >
                <span className="relative shrink-0">
                  <span
                    className={cn(
                      "inline-flex size-16 items-center justify-center rounded-2xl ring-8 ring-background [&_svg]:size-7",
                      tone,
                    )}
                  >
                    <Icon aria-hidden />
                  </span>
                  <span className="absolute -top-2 -right-2 inline-flex size-7 items-center justify-center rounded-full bg-foreground text-caption font-bold text-background">
                    {index + 1}
                  </span>
                </span>
                <div className="flex flex-col gap-1.5 pt-1 md:max-w-xs">
                  <h3 className="text-h4 text-foreground">{step.title}</h3>
                  <p className="text-body text-muted-foreground">{step.text}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>

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
