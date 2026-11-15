import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { PartnershipIcon } from "@/features/partners/components/partnership-icon";
import type { PartnershipPage } from "@/features/partners/queries";
import { getContactSettings } from "@/features/settings/queries";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** One column per step from `lg` up to six; longer procedures wrap into rows of four. */
const columns: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const actionLink =
  "mt-1 inline-flex w-fit items-center gap-1.5 rounded-md text-label text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:mx-auto";

/**
 * The partnership procedure (ADR-041) as an ordered timeline: vertical with a rail on phones,
 * one column per step with a connector from `lg`. A step can link to the quota check, the form or
 * WhatsApp. Admin-edited; static, so no client JS.
 */
export async function StepsSection({ steps }: { steps: PartnershipPage["steps"] }) {
  const [t, tWhatsApp, contact] = await Promise.all([
    getTranslations("Partnership.steps"),
    getTranslations("WhatsApp"),
    getContactSettings(),
  ]);
  const inRow = steps.length <= 6;

  const action = (step: PartnershipPage["steps"][number]) => {
    switch (step.action) {
      case "quota":
        return (
          <a href="#kuota" className={actionLink}>
            {t("actions.quota")}
            <ArrowRightIcon aria-hidden className="size-4" />
          </a>
        );
      case "apply":
        return (
          <a href="#daftar" className={actionLink}>
            {t("actions.apply")}
            <ArrowRightIcon aria-hidden className="size-4" />
          </a>
        );
      case "whatsapp":
        return (
          <a
            href={buildWhatsAppUrl(contact.whatsapp, tWhatsApp("partner"))}
            target="_blank"
            rel="noopener noreferrer"
            className={actionLink}
          >
            <BrandIcon name="whatsapp" className="size-4 text-whatsapp" />
            {t("actions.whatsapp")}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <Section id="alur" aria-labelledby="steps-title" className="scroll-mt-16">
      <DecorBlob tone="highlight" className="parallax-soft top-10 -left-24 size-72" />
      <SectionHeader
        id="steps-title"
        overline={t("overline")}
        title={t("title", { count: steps.length })}
        lead={t("lead")}
        align="center"
      />

      <Stagger
        as="ol"
        className={cn(
          "relative mx-auto mt-10 grid max-w-xl gap-0 lg:mt-14 lg:max-w-none lg:gap-6",
          inRow ? columns[steps.length] : "lg:grid-cols-4 lg:gap-y-10",
        )}
      >
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          // From `lg` the connector runs to the next column, except at the end of a wrapped row.
          const rowEnd = !inRow && (index + 1) % 4 === 0;
          return (
            <StaggerItem
              key={step.title}
              as="li"
              className="relative grid grid-cols-[3.5rem_1fr] gap-x-4 pb-8 last:pb-0 lg:flex lg:flex-col lg:items-center lg:gap-4 lg:pb-0 lg:text-center"
            >
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-14 bottom-0 left-7 w-0.5 -translate-x-1/2 bg-linear-to-b from-partner/60 to-primary/40 lg:top-7 lg:right-[calc(-50%+0.5rem)] lg:bottom-auto lg:left-[calc(50%+2rem)] lg:h-0.5 lg:w-auto lg:translate-x-0 lg:bg-linear-to-r",
                    rowEnd && "lg:hidden",
                  )}
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
                <PartnershipIcon name={step.icon} className="size-6" />
                <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <div className="flex flex-col gap-1 pt-1 lg:pt-0">
                <h3 className="text-h5 text-foreground">{step.title}</h3>
                {step.text && <p className="text-body-sm text-muted-foreground">{step.text}</p>}
                {action(step)}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
