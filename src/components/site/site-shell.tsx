import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { getContactSettings } from "@/features/settings/queries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { MobileActionBar } from "./mobile-action-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SkipLink } from "./skip-link";

const MAIN_ID = "main";

/** Public page frame: skip link, header, main landmark, footer and the mobile action bar. */
export async function SiteShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("Common");
  const tBar = await getTranslations("MobileBar");
  const tWhatsApp = await getTranslations("WhatsApp");
  const contact = await getContactSettings();

  return (
    <>
      <SkipLink targetId={MAIN_ID} label={t("skipToContent")} />
      <SiteHeader />
      <main id={MAIN_ID} tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileActionBar
        whatsappUrl={buildWhatsAppUrl(contact.whatsapp, tWhatsApp("general"))}
        labels={{
          region: tBar("label"),
          findUnit: tBar("findUnit"),
          chatWhatsApp: tBar("chatWhatsApp"),
          checkQuota: tBar("checkQuota"),
          applyPartner: tBar("applyPartner"),
        }}
      />
    </>
  );
}
