import {
  BriefcaseIcon,
  CheckIcon,
  HeartHandshakeIcon,
  PresentationIcon,
  SchoolIcon,
  WalletIcon,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import { getContactSettings } from "@/features/settings/queries";
import type { PartnershipPackage } from "@/features/partners/schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const PROFILES = [
  { key: "parent", icon: HeartHandshakeIcon },
  { key: "educator", icon: PresentationIcon },
  { key: "graduate", icon: SchoolIcon },
  { key: "entrepreneur", icon: BriefcaseIcon },
] as const;
const NEEDS = ["space", "basics", "commitment"] as const;

/**
 * Who fits (profiles + what to prepare) next to the partnership package card. The investment is
 * shown only when admins publish it; otherwise the card hands over to WhatsApp.
 */
export async function FitSection({
  partnershipPackage,
}: {
  partnershipPackage: PartnershipPackage;
}) {
  const t = await getTranslations("Partnership");
  const tWhatsApp = await getTranslations("WhatsApp");
  const contact = await getContactSettings();
  const format = await getFormatter();
  const { investment, inclusions } = partnershipPackage;

  return (
    <Section id="cocok" aria-labelledby="fit-title" className="scroll-mt-16">
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] bg-gradient-soft"
      />
      <Doodle shape="dots" tone="partner" className="parallax-soft top-14 right-[6%] size-14" />

      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="flex flex-col gap-8">
          <SectionHeader
            id="fit-title"
            overline={t("fit.overline")}
            title={t("fit.title")}
            lead={t("fit.lead")}
          />
          <Stagger as="ul" className="grid gap-3 sm:grid-cols-2">
            {PROFILES.map(({ key, icon: Icon }) => (
              <StaggerItem
                key={key}
                as="li"
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-label text-foreground">{t(`fit.${key}.title`)}</span>
                  <span className="text-body-sm text-muted-foreground">{t(`fit.${key}.text`)}</span>
                </span>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="flex flex-col gap-3">
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

        <Reveal>
          <article
            aria-labelledby="package-title"
            className="relative isolate overflow-hidden rounded-3xl bg-gradient-teal-deep p-6 text-inverse-foreground shadow-lg sm:p-8 lg:sticky lg:top-36"
          >
            <DecorBlob tone="partner" className="-top-20 -right-20 size-64 opacity-70" />
            <p className="inline-flex items-center gap-2 text-overline text-sunny-300 uppercase">
              <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
              {t("package.overline")}
            </p>
            <h3 id="package-title" className="mt-2 text-h3 text-inverse-foreground">
              {t("package.title")}
            </h3>
            <ul className="mt-6 flex flex-col gap-3">
              {inclusions.map((inclusion) => (
                <li key={inclusion} className="flex items-start gap-3 text-body">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sunny-300 text-highlight-foreground">
                    <CheckIcon aria-hidden className="size-3.5" />
                  </span>
                  {inclusion}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-white/10 p-4">
              <WalletIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-sunny-300" />
              <div className="flex flex-col gap-1">
                <p className="text-caption text-inverse-muted uppercase">
                  {t("package.investmentLabel")}
                </p>
                <p className="text-h5 text-inverse-foreground">
                  {investment === null
                    ? t("package.investmentAsk")
                    : t("package.investmentFrom", {
                        amount: format.number(investment, {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }),
                      })}
                </p>
                <p className="text-body-sm text-inverse-muted">{t("package.investmentNote")}</p>
              </div>
            </div>
            <Button asChild variant="inverse" size="lg" className="mt-6 w-full">
              <a
                href={buildWhatsAppUrl(contact.whatsapp, tWhatsApp("partner"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BrandIcon name="whatsapp" />
                {t("package.cta")}
              </a>
            </Button>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
