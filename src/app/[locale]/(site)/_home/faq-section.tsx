import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { FaqItem } from "@/features/faq/schema";
import { faqPageJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Parent FAQ with `FAQPage` structured data; answers stay in the HTML (force-mounted accordion). */
export async function FaqSection({ items }: { items: FaqItem[] }) {
  const t = await getTranslations("Home.faq");
  const tWhatsApp = await getTranslations("WhatsApp");

  return (
    <Section id="faq" aria-labelledby="faq-title">
      <JsonLd data={faqPageJsonLd(items)} />
      <Doodle shape="ring" tone="partner" className="parallax-strong bottom-24 left-[6%] size-9" />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div className="flex flex-col gap-8 lg:sticky lg:top-(--header-offset) lg:self-start">
          <SectionHeader
            id="faq-title"
            overline={t("overline")}
            title={t("title")}
            lead={t("lead")}
          />
          <Reveal className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <p className="text-h5 text-foreground">{t("askTitle")}</p>
            <p className="text-body-sm text-muted-foreground">{t("askText")}</p>
            <Button asChild variant="whatsapp" className="w-fit">
              <a
                href={buildWhatsAppUrl(siteConfig.contact.whatsapp, tWhatsApp("general"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BrandIcon name="whatsapp" />
                {t("askCta")}
              </a>
            </Button>
          </Reveal>
        </div>

        <Reveal>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
