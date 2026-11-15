import { PackageCheckIcon, WalletIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import type { PartnershipPage } from "@/features/partners/queries";
import { getContactSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { StarterKitExplorer } from "./starter-kit-explorer";

/**
 * The starter kit every partner receives (ADR-041): filterable item cards beside the package card
 * with the starting investment (or "explained during the consultation") and a WhatsApp hand-over.
 */
export async function StarterKitSection({ kit }: { kit: PartnershipPage["kit"] }) {
  const [t, tWhatsApp, contact, format] = await Promise.all([
    getTranslations("Partnership.kit"),
    getTranslations("WhatsApp"),
    getContactSettings(),
    getFormatter(),
  ]);

  return (
    <Section id="starter-kit" aria-labelledby="kit-title" className="scroll-mt-16">
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] bg-gradient-soft"
      />
      <SectionHeader id="kit-title" overline={t("overline")} title={t("title")} lead={t("lead")} />

      <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <StarterKitExplorer
          items={kit.items}
          labels={{
            filter: t("filter"),
            all: t("all"),
            groups: {
              materials: t("groups.materials"),
              classroom: t("groups.classroom"),
              guides: t("groups.guides"),
            },
            shown: t.raw("shown") as string,
          }}
        />

        <Reveal>
          <article
            aria-labelledby="package-title"
            className="relative isolate overflow-hidden rounded-3xl bg-gradient-teal-deep p-6 text-inverse-foreground shadow-lg sm:p-7 lg:sticky lg:top-36"
          >
            <DecorBlob tone="partner" className="-top-20 -right-20 size-64 opacity-70" />
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-partner text-partner-foreground shadow-glow-partner">
              <PackageCheckIcon aria-hidden className="size-6" />
            </span>
            <h3 id="package-title" className="mt-4 text-h4 text-inverse-foreground">
              {t("packageTitle", { count: kit.items.length })}
            </h3>
            <p className="mt-2 text-body-sm text-inverse-muted">{t("packageText")}</p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/10 p-4">
              <WalletIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-sunny-300" />
              <div className="flex flex-col gap-1">
                <p className="text-caption text-inverse-muted uppercase">{t("investmentLabel")}</p>
                <p className="text-h5 text-inverse-foreground">
                  {kit.investment === null
                    ? t("investmentAsk")
                    : t("investmentFrom", {
                        amount: format.number(kit.investment, {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }),
                      })}
                </p>
                <p className="text-body-sm text-inverse-muted">{t("investmentNote")}</p>
              </div>
            </div>
            <Button asChild variant="inverse" size="lg" className="mt-6 w-full">
              <a
                href={buildWhatsAppUrl(contact.whatsapp, tWhatsApp("partner"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BrandIcon name="whatsapp" />
                {t("cta")}
              </a>
            </Button>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
