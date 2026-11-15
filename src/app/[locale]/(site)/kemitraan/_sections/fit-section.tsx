import {
  BriefcaseIcon,
  CheckIcon,
  HeartHandshakeIcon,
  PresentationIcon,
  SchoolIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";

const PROFILES = [
  { key: "parent", icon: HeartHandshakeIcon },
  { key: "educator", icon: PresentationIcon },
  { key: "graduate", icon: SchoolIcon },
  { key: "entrepreneur", icon: BriefcaseIcon },
] as const;
const NEEDS = ["space", "basics", "commitment"] as const;

/**
 * Who fits: the profiles of partners who join, beside what to prepare. The starter kit and the
 * investment have their own section (ADR-041).
 */
export async function FitSection() {
  const t = await getTranslations("Partnership");

  return (
    <Section id="cocok" aria-labelledby="fit-title" className="scroll-mt-16">
      <Doodle shape="dots" tone="partner" className="parallax-soft top-14 right-[6%] size-14" />

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        <div className="flex flex-col gap-8">
          <SectionHeader
            id="fit-title"
            overline={t("fit.overline")}
            title={t("fit.title")}
            lead={t("fit.lead")}
          />
          <Reveal className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h3 className="text-h5 text-foreground">{t("fit.needsTitle")}</h3>
            <ul className="flex flex-col gap-2.5">
              {NEEDS.map((need) => (
                <li key={need} className="flex items-start gap-3 text-body text-foreground">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-strong">
                    <CheckIcon aria-hidden className="size-3.5" />
                  </span>
                  {t(`fit.needs.${need}`)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Stagger as="ul" className="grid gap-3 sm:grid-cols-2 lg:mt-2">
          {PROFILES.map(({ key, icon: Icon }) => (
            <StaggerItem
              key={key}
              as="li"
              className="flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="text-h5 text-foreground">{t(`fit.${key}.title`)}</span>
              <span className="text-body-sm text-muted-foreground">{t(`fit.${key}.text`)}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
