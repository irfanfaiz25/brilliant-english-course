import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { PartnershipIcon } from "@/features/partners/components/partnership-icon";
import type { PartnershipPage } from "@/features/partners/queries";
import { cn } from "@/lib/utils";

type Benefit = PartnershipPage["benefits"][number];

/** Columns of the featured row by how many there are, so one to four always look balanced. */
const featuredColumns: Record<number, string> = {
  1: "md:mx-auto md:max-w-2xl",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

/**
 * Why join (ADR-041), as a bento: the featured benefits (no profit sharing, protected area …) on
 * large deep-teal cards, then the rest on light cards. Admin-edited; static, so no client JS.
 */
export async function BenefitsSection({ benefits }: { benefits: Benefit[] }) {
  const t = await getTranslations("Partnership.benefits");
  const featured = benefits.filter((item) => item.featured);
  const others = benefits.filter((item) => !item.featured);

  return (
    <Section id="keuntungan" aria-labelledby="benefits-title" className="scroll-mt-16">
      <DecorBlob tone="primary" className="parallax-soft top-24 -right-24 size-80" />
      <SectionHeader
        id="benefits-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />

      {featured.length > 0 && (
        <Stagger
          as="ul"
          className={cn(
            "mt-10 grid gap-4 lg:mt-14 lg:gap-6",
            featuredColumns[featured.length] ?? "md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {featured.map((item) => (
            <StaggerItem key={item.title} as="li" className="h-full">
              <article className="group relative isolate flex h-full flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-teal-deep p-6 text-inverse-foreground shadow-lg lg:p-7">
                <span
                  aria-hidden
                  className="absolute -top-10 -right-10 -z-10 size-40 rounded-full bg-partner/25 blur-2xl transition-transform duration-(--duration-slow) ease-out group-hover:scale-125"
                />
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-partner text-partner-foreground shadow-glow-partner transition-transform duration-(--duration-base) ease-out group-hover:-rotate-6">
                  <PartnershipIcon name={item.icon} className="size-6" />
                </span>
                <h3 className="text-h4">{item.title}</h3>
                {item.text && <p className="text-body text-inverse-muted">{item.text}</p>}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {others.length > 0 && (
        <Stagger
          as="ul"
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:mt-6 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
        >
          {others.map((item) => (
            <StaggerItem key={item.title} as="li" className="h-full">
              <article className="group flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-(--duration-base) ease-out group-hover:scale-110 group-hover:-rotate-6">
                  <PartnershipIcon name={item.icon} className="size-5" />
                </span>
                <h3 className="text-h5 text-foreground">{item.title}</h3>
                {item.text && <p className="text-body-sm text-muted-foreground">{item.text}</p>}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}
