import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { PartnershipIcon } from "@/features/partners/components/partnership-icon";
import type { PartnershipPage } from "@/features/partners/queries";
import { balancedGridClass, balancedItemClass } from "@/lib/balanced-grid";
import { cn } from "@/lib/utils";

import { LessonFlow } from "./lesson-flow";

/**
 * BEC training (ADR-041): the lesson flow tutors learn as an interactive walk-through, beside a
 * photo of a session and the training formats (online/offline, admin, book walkthroughs).
 */
export async function TrainingSection({ training }: { training: PartnershipPage["training"] }) {
  const t = await getTranslations("Partnership.training");

  return (
    <Section id="pelatihan" aria-labelledby="training-title" className="scroll-mt-16">
      <DecorBlob tone="highlight" className="parallax-soft top-20 -left-24 size-80" />
      <SectionHeader
        id="training-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />

      <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:mt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          {training.image && (
            <Reveal className="relative aspect-[16/10] overflow-hidden rounded-3xl border-4 border-background shadow-lg">
              <Image
                src={training.image.src}
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          )}
          <Stagger as="ul" className={cn(balancedGridClass, "gap-3")}>
            {training.formats.map((format, index) => (
              <StaggerItem
                key={format.title}
                as="li"
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card",
                  balancedItemClass(index, training.formats.length, {
                    base: 1,
                    sm: 2,
                    lg: 1,
                    xl: 2,
                  }),
                )}
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <PartnershipIcon name={format.icon} className="size-5" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-label text-foreground">{format.title}</span>
                  {format.text && (
                    <span className="text-body-sm text-muted-foreground">{format.text}</span>
                  )}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Reveal className="order-first flex min-w-0 flex-col gap-3 lg:sticky lg:top-36 lg:order-none">
          <p className="text-label text-foreground">{t("flowTitle")}</p>
          <LessonFlow
            stages={training.flow}
            labels={{
              list: t("flowTitle"),
              progress: t.raw("progress") as string,
              previous: t("previous"),
              next: t("next"),
            }}
          />
        </Reveal>
      </div>
    </Section>
  );
}
