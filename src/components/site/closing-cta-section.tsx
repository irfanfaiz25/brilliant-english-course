import { MapPinIcon } from "lucide-react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type ClosingCtaSectionProps = {
  title: string;
  lead: string;
  primaryLabel: string;
  secondaryLabel: string;
  whatsappMessage: string;
};

/** Closing call to action: one last nudge towards the two parent actions (find a unit / WhatsApp). */
export function ClosingCtaSection({
  title,
  lead,
  primaryLabel,
  secondaryLabel,
  whatsappMessage,
}: ClosingCtaSectionProps) {
  return (
    <Section aria-labelledby="closing-cta-title" spacing="compact" className="pb-20 md:pb-28">
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
            <h2 id="closing-cta-title" className="text-h1 text-foreground">
              {title}
            </h2>
            <p className="text-body-lg text-muted-foreground">{lead}</p>
            <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:w-auto sm:flex-row">
              <Button asChild size="lg" pop>
                <Link href="/cek-unit">
                  <MapPinIcon aria-hidden />
                  {primaryLabel}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" pop>
                <a
                  href={buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BrandIcon name="whatsapp" className="text-whatsapp" />
                  {secondaryLabel}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
