import {
  BookOpenCheckIcon,
  GraduationCapIcon,
  MapPinnedIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  type LucideIcon,
  ClipboardListIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getQuotaRules } from "@/features/quota/queries";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { key: "curriculum", icon: BookOpenCheckIcon, tone: "bg-primary-soft text-primary" },
  { key: "training", icon: GraduationCapIcon, tone: "bg-partner-soft text-partner" },
  { key: "marketing", icon: MegaphoneIcon, tone: "bg-level-kindy-soft text-level-kindy-strong" },
  { key: "system", icon: ClipboardListIcon, tone: "bg-primary-soft text-primary" },
  { key: "brand", icon: ShieldCheckIcon, tone: "bg-partner-soft text-partner" },
  { key: "territory", icon: MapPinnedIcon, tone: "bg-level-kindy-soft text-level-kindy-strong" },
] as const satisfies readonly { key: string; icon: LucideIcon; tone: string }[];

/** What BEC provides, as six equal cards (two columns on tablets, three on desktop). */
export async function BenefitsSection() {
  const [t, rules] = await Promise.all([getTranslations("Partnership.benefits"), getQuotaRules()]);

  return (
    <Section id="keuntungan" aria-labelledby="benefits-title" className="scroll-mt-16">
      <DecorBlob tone="primary" className="parallax-soft top-24 -right-24 size-80" />
      <SectionHeader
        id="benefits-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />
      <Stagger as="ul" className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
        {BENEFITS.map(({ key, icon: Icon, tone }) => (
          <StaggerItem key={key} as="li" className="h-full">
            <article className="group flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg">
              <span
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-xl transition-transform duration-(--duration-base) ease-out group-hover:scale-110 group-hover:-rotate-6",
                  tone,
                )}
              >
                <Icon aria-hidden className="size-6" />
              </span>
              <h3 className="text-h5 text-foreground">{t(`${key}.title`)}</h3>
              <p className="text-body text-muted-foreground">
                {t(`${key}.text`, { max: rules.unitsPerVillage })}
              </p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
