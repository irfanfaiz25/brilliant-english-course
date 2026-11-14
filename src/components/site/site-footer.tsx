import { MailIcon, MapPinIcon } from "lucide-react";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { socialNetworkNames, type SocialNetwork } from "@/config/site";
import { getContactSettings } from "@/features/settings/queries";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { DecorBlob } from "./decor-blob";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";

/** Current year for the copyright line, cached so pages stay static (Cache Components). */
async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const footerLinkClass =
  "text-body-sm text-inverse-muted transition-colors duration-(--duration-fast) hover:text-inverse-foreground";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const tWhatsApp = await getTranslations("WhatsApp");
  const contact = await getContactSettings();
  const year = await getCopyrightYear();

  const levels = [t("levelKindy"), t("levelIntro"), t("levelSecondary")];

  return (
    <footer className="relative isolate overflow-hidden bg-gradient-teal-deep text-inverse-foreground">
      <DecorBlob tone="inverse" className="-top-24 -left-24 size-80" />
      <DecorBlob tone="partner" className="-right-32 bottom-0 size-96 opacity-60" />

      <div className="mx-auto grid w-full max-w-page grid-cols-2 gap-12 gap-x-6 px-5 pt-16 pb-12 md:px-8 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:pt-20">
        <div className="col-span-2 flex flex-col gap-6 lg:col-span-1">
          <span className="inline-flex w-fit rounded-2xl bg-white p-3 shadow-lg">
            <Logo label={tNav("homeLabel")} className="h-14" />
          </span>
          <p className="max-w-sm text-body-sm text-inverse-muted">{t("tagline")}</p>
          <ul className="flex gap-2">
            {(Object.keys(contact.social) as SocialNetwork[]).map((network) => (
              <li key={network}>
                <a
                  href={contact.social[network]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("followUs", { network: socialNetworkNames[network] })}
                  className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-inverse-foreground transition-[background-color,transform] duration-(--duration-fast) hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <BrandIcon name={network} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-labelledby="footer-programs" className="flex flex-col gap-4">
          <h2 id="footer-programs" className="text-overline text-inverse-subtle uppercase">
            {t("programs")}
          </h2>
          <ul className="flex flex-col gap-3">
            {levels.map((level) => (
              <li key={level}>
                <Link href="/program" className={footerLinkClass}>
                  {level}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-explore" className="flex flex-col gap-4">
          <h2 id="footer-explore" className="text-overline text-inverse-subtle uppercase">
            {t("explore")}
          </h2>
          <ul className="flex flex-col gap-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={footerLinkClass}>
                  {tNav(item.label)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/unit" className={footerLinkClass}>
                {tNav("allUnits")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
          <h2 className="text-overline text-inverse-subtle uppercase">{t("contactUs")}</h2>
          <Button asChild variant="whatsapp" size="sm" className="w-fit">
            <a
              href={buildWhatsAppUrl(contact.whatsapp, tWhatsApp("general"))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <BrandIcon name="whatsapp" className="size-4" />
              {t("chatWhatsApp")}
            </a>
          </Button>
          <a
            href={`mailto:${contact.email}`}
            className={`${footerLinkClass} inline-flex items-center gap-2`}
          >
            <MailIcon aria-hidden className="size-4" />
            {contact.email}
          </a>
          <p className="inline-flex items-center gap-2 text-body-sm text-inverse-muted">
            <MapPinIcon aria-hidden className="size-4 shrink-0" />
            {contact.address}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-page flex-col-reverse items-center justify-between gap-4 px-5 pt-6 pb-28 md:px-8 lg:flex-row lg:pb-6">
          <p className="text-caption text-inverse-muted">{t("rights", { year })}</p>
          <LocaleSwitcher tone="dark" />
        </div>
      </div>
    </footer>
  );
}
