import { MapPinIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Closing call to action: one last nudge towards the two parent actions. */
export async function CtaSection() {
  const t = await getTranslations("Home.cta");
  const tWhatsApp = await getTranslations("WhatsApp");

  return (
    <Section aria-labelledby="cta-title" spacing="compact" className="pb-20 md:pb-28">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-3xl border border-border/60 px-6 py-14 text-center shadow-glow-partner bg-gradient-warm sm:px-12 lg:py-20">
          <DecorBlob tone="partner" className="parallax-soft -top-20 -right-16 size-72" />
          <DecorBlob tone="primary" className="parallax-strong -bottom-24 -left-16 size-80" />
          <Doodle
            shape="squiggle"
            tone="partner"
            className="top-10 left-[12%] hidden w-16 md:block"
          />
          <Doodle
            shape="plus"
            tone="primary"
            className="right-[14%] bottom-12 size-7 animate-float"
          />

          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
            <h2 id="cta-title" className="text-h1 text-foreground">
              {t("title")}
            </h2>
            <p className="text-body-lg text-muted-foreground">{t("lead")}</p>
            <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:w-auto sm:flex-row">
              <Button asChild size="lg" pop>
                <Link href="/cek-unit">
                  <MapPinIcon aria-hidden />
                  {t("primary")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" pop>
                <a
                  href={buildWhatsAppUrl(siteConfig.contact.whatsapp, tWhatsApp("general"))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BrandIcon name="whatsapp" className="text-whatsapp" />
                  {t("secondary")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
