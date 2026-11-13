import {
  ArrowRightIcon,
  HandshakeIcon,
  MailIcon,
  MapPinIcon,
  NewspaperIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import type { ContactSettings } from "@/features/settings/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Route = {
  key: "parent" | "partner" | "other";
  icon: LucideIcon;
  tone: string;
  variant: "primary" | "partner" | "secondary";
  primary: ReactNode;
  secondary: ReactNode;
};

const secondaryLinkClass =
  "inline-flex items-center gap-1.5 rounded-sm text-label text-muted-foreground transition-colors duration-(--duration-fast) hover:text-primary";

/**
 * "Who are you?" router: parents go to their unit (it owns schedules and fees), partners to the
 * partnership page, everyone else to email or the message form.
 */
export async function ContactRoutes({ contact }: { contact: ContactSettings }) {
  const t = await getTranslations("Contact.routes");
  const tWhatsApp = await getTranslations("WhatsApp");

  const whatsappLink = (message: string, label: string) => (
    <a
      href={buildWhatsAppUrl(contact.whatsapp, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={secondaryLinkClass}
    >
      <BrandIcon name="whatsapp" className="size-4 text-whatsapp" />
      {label}
    </a>
  );

  const routes: Route[] = [
    {
      key: "parent",
      icon: UsersIcon,
      tone: "bg-primary-soft text-primary",
      variant: "primary",
      primary: (
        <Link href="/cek-unit">
          <MapPinIcon aria-hidden />
          {t("parent.primary")}
        </Link>
      ),
      secondary: whatsappLink(tWhatsApp("general"), t("parent.secondary")),
    },
    {
      key: "partner",
      icon: HandshakeIcon,
      tone: "bg-partner-soft text-partner",
      variant: "partner",
      primary: (
        <Link href="/kemitraan">
          <HandshakeIcon aria-hidden />
          {t("partner.primary")}
        </Link>
      ),
      secondary: whatsappLink(tWhatsApp("partner"), t("partner.secondary")),
    },
    {
      key: "other",
      icon: NewspaperIcon,
      tone: "bg-level-kindy-soft text-level-kindy-strong",
      variant: "secondary",
      primary: (
        <a href={`mailto:${contact.email}`}>
          <MailIcon aria-hidden />
          {t("other.primary")}
        </a>
      ),
      secondary: (
        <a href="#pesan" className={secondaryLinkClass}>
          {t("other.secondary")}
          <ArrowRightIcon aria-hidden className="size-4" />
        </a>
      ),
    },
  ];

  return (
    <Section aria-labelledby="routes-title" spacing="compact">
      <SectionHeader
        id="routes-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      />
      <Stagger as="ul" className="mt-8 grid gap-4 md:grid-cols-3 lg:mt-10 lg:gap-6">
        {routes.map(({ key, icon: Icon, tone, variant, primary, secondary }) => (
          <StaggerItem key={key} as="li" className="h-full">
            <article className="group flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg">
              <span
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-xl transition-transform duration-(--duration-base) ease-out group-hover:scale-110 group-hover:-rotate-6",
                  tone,
                )}
              >
                <Icon aria-hidden className="size-6" />
              </span>
              <h3 className="text-h5 text-foreground">{t(`${key}.title`)}</h3>
              <p className="flex-1 text-body text-muted-foreground">{t(`${key}.text`)}</p>
              <div className="flex flex-col gap-3 pt-1">
                <Button asChild variant={variant} className="w-full">
                  {primary}
                </Button>
                <div className="flex justify-center">{secondary}</div>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
