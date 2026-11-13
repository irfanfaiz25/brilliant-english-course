import { ArrowRightIcon, HandshakeIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { DecorBlob } from "@/components/site/decor-blob";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Cross-journey nudge for visitors whose village has no unit yet (DESIGN.md § 5.1). */
export async function PartnerBanner() {
  const t = await getTranslations("Finder.partner");

  return (
    <Section spacing="compact" className="pb-20 md:pb-28">
      <Reveal>
        <div className="relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-3xl bg-gradient-teal-deep px-6 py-10 text-inverse-foreground shadow-lg sm:px-10 md:flex-row md:items-center md:justify-between">
          <DecorBlob
            tone="partner"
            className="parallax-soft -right-16 -bottom-24 size-80 opacity-70"
          />
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sunny-300 [&_svg]:size-6">
              <HandshakeIcon aria-hidden />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-h3">{t("title")}</h2>
              <p className="max-w-xl text-body text-inverse-muted">{t("text")}</p>
            </div>
          </div>
          <Button asChild variant="partner" size="lg" pop className="shrink-0">
            <Link href="/kemitraan">
              {t("cta")}
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
