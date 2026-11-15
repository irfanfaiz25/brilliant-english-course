import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { PartnershipIcon } from "@/features/partners/components/partnership-icon";
import type { PartnershipPage } from "@/features/partners/queries";
import { balancedGridClass, balancedItemClass } from "@/lib/balanced-grid";
import { cn } from "@/lib/utils";

type Benefit = PartnershipPage["benefits"][number];

/**
 * Why join (ADR-041), as a bento: the featured benefits (no profit sharing, protected area …) on
 * large deep-teal cards, then the rest on light cards. Both grids are balanced, so however many
 * benefits admins add, the last row is full. Admin-edited; static, so no client JS.
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
        <Stagger as="ul" className={cn(balancedGridClass, "mt-10 gap-4 lg:mt-14 lg:gap-6")}>
          {featured.map((item, index) => (
            <StaggerItem
              key={item.title}
              as="li"
              className={cn(
                "h-full",
                balancedItemClass(index, featured.length, { base: 1, md: "auto" }),
              )}
            >
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
        <Stagger as="ul" className={cn(balancedGridClass, "mt-4 gap-4 lg:mt-6 lg:gap-6")}>
          {others.map((item, index) => (
            <StaggerItem
              key={item.title}
              as="li"
              className={cn(
                "h-full",
                balancedItemClass(index, others.length, { base: 1, sm: 2, lg: "auto" }),
              )}
            >
              {/* A card widened to fill the last row lays out side by side (container query). */}
              <article className="group @container h-full rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg">
                <div className="flex flex-col gap-3 @md:flex-row @md:items-start @md:gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-(--duration-base) ease-out group-hover:scale-110 group-hover:-rotate-6">
                    <PartnershipIcon name={item.icon} className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-h5 text-foreground">{item.title}</h3>
                    {item.text && <p className="text-body-sm text-muted-foreground">{item.text}</p>}
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}
