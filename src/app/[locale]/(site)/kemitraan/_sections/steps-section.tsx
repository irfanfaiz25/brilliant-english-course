import {
  ClipboardPenIcon,
  GraduationCapIcon,
  MapPinnedIcon,
  MessagesSquareIcon,
  RocketIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "quota", icon: MapPinnedIcon },
  { key: "apply", icon: ClipboardPenIcon },
  { key: "consult", icon: MessagesSquareIcon },
  { key: "training", icon: GraduationCapIcon },
  { key: "launch", icon: RocketIcon },
] as const;

/**
 * The partner journey as an ordered timeline: vertical with a rail on phones, five columns with
 * a connector from `lg`. Static content, so no client JS — only the shared reveal stagger.
 */
export async function StepsSection() {
  const t = await getTranslations("Partnership.steps");

  return (
    <Section id="alur" aria-labelledby="steps-title" className="scroll-mt-16">
      <DecorBlob tone="highlight" className="parallax-soft top-10 -left-24 size-72" />
      <SectionHeader
        id="steps-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />

      <Stagger
        as="ol"
        className="relative mx-auto mt-10 grid max-w-xl gap-0 lg:mt-14 lg:max-w-none lg:grid-cols-5 lg:gap-6"
      >
        {STEPS.map(({ key, icon: Icon }, index) => {
          const last = index === STEPS.length - 1;
          return (
            <StaggerItem
              key={key}
              as="li"
              className="relative grid grid-cols-[3.5rem_1fr] gap-x-4 pb-8 last:pb-0 lg:flex lg:flex-col lg:items-center lg:gap-4 lg:pb-0 lg:text-center"
            >
              {/* Rail to the next step: down on phones, across from `lg` (per step, so it stays centred). */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute top-14 bottom-0 left-7 w-0.5 -translate-x-1/2 bg-linear-to-b from-partner/60 to-primary/40 lg:top-7 lg:right-[calc(-50%+0.5rem)] lg:bottom-auto lg:left-[calc(50%+2rem)] lg:h-0.5 lg:w-auto lg:translate-x-0 lg:bg-linear-to-r"
                />
              )}
              <span
                className={cn(
                  "relative inline-flex size-14 items-center justify-center rounded-2xl shadow-card",
                  last
                    ? "bg-partner text-partner-foreground shadow-glow-partner"
                    : "border border-border/60 bg-card text-partner",
                )}
              >
                <Icon aria-hidden className="size-6" />
                <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <div className="flex flex-col gap-1 pt-1 lg:pt-0">
                <h3 className="text-h5 text-foreground">{t(`${key}.title`)}</h3>
                <p className="text-body-sm text-muted-foreground">{t(`${key}.text`)}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
