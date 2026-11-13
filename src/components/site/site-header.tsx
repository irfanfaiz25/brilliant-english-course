import { MapPinIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { HeaderScrollState } from "./header-scroll-state";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

const HEADER_ID = "site-header";

/**
 * Sticky site header (DESIGN.md § 4 Navbar). Transparent at the top of the page, frosted glass
 * with a soft shadow once scrolled. Desktop shows the full nav; below `lg` a menu sheet.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const tWhatsApp = await getTranslations("WhatsApp");
  const tFooter = await getTranslations("Footer");
  const items = mainNav.map((item) => ({ href: item.href, label: t(item.label) }));

  return (
    <>
      <HeaderScrollState headerId={HEADER_ID} />
      <header
        id={HEADER_ID}
        data-scrolled="false"
        style={{ viewTransitionName: HEADER_ID }}
        className="sticky top-0 z-(--z-header) border-b border-transparent transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-out data-[scrolled=true]:border-border/60 data-[scrolled=true]:surface-glass data-[scrolled=true]:shadow-md"
      >
        <div className="mx-auto flex h-16 w-full max-w-page items-center gap-4 px-5 md:h-20 md:px-8">
          <Logo label={t("homeLabel")} priority className="h-11 md:h-14" />

          <nav aria-label={t("primaryLabel")} className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <LocaleSwitcher className="hidden lg:block" />
            <Button asChild variant="partner" size="sm" className="hidden lg:inline-flex">
              <Link href="/kemitraan">{t("joinPartner")}</Link>
            </Button>
            <Button asChild variant="secondary" size="icon-sm" className="lg:hidden">
              <Link href="/cek-unit" aria-label={t("findUnit")}>
                <MapPinIcon aria-hidden />
              </Link>
            </Button>
            <div className="lg:hidden">
              <MobileMenu
                items={items}
                whatsappUrl={buildWhatsAppUrl(siteConfig.contact.whatsapp, tWhatsApp("general"))}
                labels={{
                  open: t("openMenu"),
                  title: t("menuTitle"),
                  description: t("menuDescription"),
                  findUnit: t("findUnit"),
                  joinPartner: t("joinPartner"),
                  chatWhatsApp: tFooter("chatWhatsApp"),
                }}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
