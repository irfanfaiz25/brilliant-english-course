import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { PageCanvas } from "@/components/site/page-canvas";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { siteConfig } from "@/config/site";
import { getContactSettings } from "@/features/settings/queries";
import { formatUnitSchedule } from "@/features/units/service";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { localizedAlternates } from "@/lib/seo/alternates";
import { JsonLd, organizationJsonLd } from "@/lib/seo/json-ld";

import { ContactDetails } from "./_sections/contact-details";
import { ContactHero } from "./_sections/contact-hero";
import { ContactRoutes } from "./_sections/contact-routes";
import { MessageComposer } from "./_sections/message-composer";

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kontak">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Contact" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/kontak", locale),
  };
}

/**
 * Kontak (Phase 5f): routes each visitor to the right channel first (unit, partnership team or
 * email), then offers a WhatsApp message composer beside the head-office details.
 */
export default async function ContactPage({ params }: PageProps<"/[locale]/kontak">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;

  const t = await getTranslations("Contact");
  const contact = await getContactSettings();
  const hours = contact.officeHours.map((entry) =>
    formatUnitSchedule(
      { openDays: entry.days, opensAt: entry.opens, closesAt: entry.closes },
      locale,
    ),
  );

  return (
    <PageCanvas>
      <JsonLd
        data={organizationJsonLd({
          name: siteConfig.name,
          url: absoluteUrl(getPathname({ href: "/", locale })),
          logo: absoluteUrl(siteConfig.logo.fallbackSrc),
          email: contact.email,
          telephone: `+${contact.whatsapp}`,
          address: contact.address,
          sameAs: Object.values(contact.social),
          hours: contact.officeHours.map((entry) => ({
            days: entry.days.map((day) => SCHEMA_DAYS[day - 1] ?? "Monday"),
            opens: entry.opens,
            closes: entry.closes,
          })),
          availableLanguage: ["Indonesian", "English"],
        })}
      />
      <ContactHero hoursText={hours[0] ?? ""} />
      <ContactRoutes contact={contact} />
      <Section id="pesan" aria-labelledby="message-title" className="scroll-mt-24 pb-20 md:pb-28">
        <span
          aria-hidden
          className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] bg-gradient-warm"
        />
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div className="flex flex-col gap-8">
            <SectionHeader
              id="message-title"
              overline={t("message.overline")}
              title={t("message.title")}
              lead={t("message.lead")}
            />
            <MessageComposer whatsapp={contact.whatsapp} />
          </div>
          <ContactDetails contact={contact} hours={hours} />
        </div>
      </Section>
    </PageCanvas>
  );
}
