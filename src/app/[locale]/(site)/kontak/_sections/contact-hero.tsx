import { ClockIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HeroChip, PageHero } from "@/components/site/page-hero";

/** Page header with the reply window, so visitors know when to expect an answer. */
export async function ContactHero({ hoursText }: { hoursText: string }) {
  const t = await getTranslations("Contact.hero");
  const tNav = await getTranslations("Nav");

  return (
    <PageHero
      id="contact-title"
      breadcrumbs={[
        { label: tNav("home"), href: "/" },
        { label: tNav("contact"), href: "/kontak" },
      ]}
      overline={t("overline")}
      title={t("title")}
      lead={t("lead")}
    >
      <HeroChip icon={<ClockIcon aria-hidden />}>
        {/* The label hides on phones so the pill stays on one line. */}
        <span className="max-sm:sr-only">{t("hoursLabel")} ·</span>
        {hoursText}
      </HeroChip>
    </PageHero>
  );
}
