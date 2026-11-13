import { CheckIcon, HandshakeIcon, MapPinnedIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import { placeholderImages } from "@/config/placeholder-images";
import { Link } from "@/i18n/navigation";

/**
 * Partnership teaser for prospective partners: a dark rounded panel floating on the canvas
 * (not a full-width band, so the page background stays continuous).
 */
export async function PartnershipSection({ activeUnits }: { activeUnits: number }) {
  const t = await getTranslations("Home.partnership");
  const benefits = [t("benefit1"), t("benefit2"), t("benefit3")];

  return (
    <Section aria-labelledby="partnership-title" spacing="compact">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-teal-deep px-6 py-12 text-inverse-foreground shadow-lg sm:px-10 lg:px-16 lg:py-16">
          <DecorBlob tone="inverse" className="parallax-strong -top-24 -left-24 size-96" />
          <DecorBlob
            tone="partner"
            className="parallax-soft -right-24 -bottom-32 size-96 opacity-70"
          />
          <Doodle
            shape="squiggle"
            tone="highlight"
            className="top-10 right-[38%] hidden w-16 lg:block"
          />
          <Doodle shape="dots" tone="soft" className="bottom-10 left-[44%] size-14 opacity-40" />

          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col gap-7">
              <SectionHeader
                id="partnership-title"
                overline={t("overline")}
                title={t("title")}
                lead={t("lead")}
                tone="inverse"
              />
              <ul className="flex flex-col gap-3">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 text-body text-inverse-foreground"
                  >
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sunny-300 text-highlight-foreground">
                      <CheckIcon aria-hidden className="size-4" />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-body-sm text-inverse-muted">
                <MapPinnedIcon aria-hidden className="size-4 shrink-0 text-sunny-300" />
                {t("quotaNote")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="partner" size="lg" pop>
                  <Link href={{ pathname: "/kemitraan", hash: "daftar" }}>
                    <HandshakeIcon aria-hidden />
                    {t("primaryCta")}
                  </Link>
                </Button>
                <Button asChild variant="inverse" size="lg" pop>
                  <Link href="/kemitraan">{t("secondaryCta")}</Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <span
                aria-hidden
                className="absolute -inset-3 -z-10 -rotate-3 rounded-2xl bg-white/10"
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-4 border-white/20 shadow-lg lg:aspect-square">
                <Image
                  src={placeholderImages.activityBook.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 32vw, 90vw"
                  className="object-cover"
                />
              </div>
              <p className="absolute -bottom-6 -left-4 flex animate-float items-center gap-3 rounded-2xl bg-background px-5 py-3 text-foreground shadow-lg motion-reduce:animate-none sm:-left-8">
                <span className="text-h3 text-partner">
                  <CountUp value={activeUnits} suffix="+" />
                </span>
                <span className="max-w-28 text-caption text-muted-foreground">
                  {t("joinedLabel")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
