import { ClockIcon, MailIcon, MapPinIcon, NavigationIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { DecorBlob } from "@/components/site/decor-blob";
import { FactRow } from "@/components/site/fact-row";
import { socialNetworkNames, type SocialNetwork } from "@/config/site";
import type { ContactSettings } from "@/features/settings/schema";
import { buildDirectionsUrl } from "@/features/units/service";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** "+62 812-0000-0000" style display of an international number. */
function displayPhone(phone: string): string {
  const local = phone.replace(/^62/, "");
  return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
}

const inverseLinkClass =
  "break-words underline decoration-white/30 underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-white";

/** Head-office details on a dark panel: channels, address with directions, hours and socials. */
export async function ContactDetails({
  contact,
  hours,
}: {
  contact: ContactSettings;
  /** Office hours already formatted per locale, one line per group of days. */
  hours: readonly string[];
}) {
  const t = await getTranslations("Contact.details");
  const tWhatsApp = await getTranslations("WhatsApp");

  return (
    <aside
      aria-labelledby="details-title"
      className="relative isolate flex flex-col gap-7 overflow-hidden rounded-3xl bg-gradient-teal-deep p-6 text-inverse-foreground shadow-lg sm:p-8 lg:sticky lg:top-28"
    >
      <DecorBlob tone="partner" className="-top-20 -right-20 size-64 opacity-70" />
      <h3 id="details-title" className="text-h4 text-inverse-foreground">
        {t("title")}
      </h3>

      <dl className="flex flex-col gap-5">
        <FactRow tone="inverse" icon={<BrandIcon name="whatsapp" />} label={t("whatsapp")}>
          <a
            href={buildWhatsAppUrl(contact.whatsapp, tWhatsApp("general"))}
            target="_blank"
            rel="noopener noreferrer"
            className={inverseLinkClass}
          >
            {displayPhone(contact.whatsapp)}
          </a>
        </FactRow>
        <FactRow tone="inverse" icon={<MailIcon aria-hidden />} label={t("email")}>
          <a href={`mailto:${contact.email}`} className={inverseLinkClass}>
            {contact.email}
          </a>
        </FactRow>
        <FactRow tone="inverse" icon={<MapPinIcon aria-hidden />} label={t("address")}>
          <span className="flex flex-col gap-2">
            {contact.address}
            <a
              href={buildDirectionsUrl(contact.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-label text-sunny-300 transition-colors duration-(--duration-fast) hover:text-inverse-foreground"
            >
              <NavigationIcon aria-hidden className="size-4" />
              {t("directions")}
            </a>
          </span>
        </FactRow>
        <FactRow tone="inverse" icon={<ClockIcon aria-hidden />} label={t("hours")}>
          <span className="flex flex-col gap-1">
            {hours.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </FactRow>
      </dl>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
        <p className="text-caption text-inverse-muted uppercase">{t("social")}</p>
        <ul className="flex gap-2">
          {(Object.keys(contact.social) as SocialNetwork[]).map((network) => (
            <li key={network}>
              <a
                href={contact.social[network]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("followUs", { network: socialNetworkNames[network] })}
                className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 transition-[background-color,transform] duration-(--duration-fast) hover:-translate-y-0.5 hover:bg-white/20"
              >
                <BrandIcon name={network} className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
