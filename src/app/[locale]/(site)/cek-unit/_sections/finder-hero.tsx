import { MapIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HeroChip, PageHero } from "@/components/site/page-hero";

export async function FinderHero() {
  const t = await getTranslations("Finder.hero");
  const tNav = await getTranslations("Nav");

  return (
    <PageHero
      id="finder-title"
      breadcrumbs={[
        { label: tNav("home"), href: "/" },
        { label: tNav("findUnit"), href: "/cek-unit" },
      ]}
      overline={t("overline")}
      title={t("title")}
      lead={t("lead")}
    >
      <HeroChip icon={<MapIcon aria-hidden />}>{t("note")}</HeroChip>
    </PageHero>
  );
}
