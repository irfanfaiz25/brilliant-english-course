import { ClipboardPenIcon, MapPinIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { DecorBlob } from "@/components/site/decor-blob";
import { Button } from "@/components/ui/button";
import { getContactSettings } from "@/features/settings/queries";
import type { PostCategory } from "@/features/blog/schema";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Next step after reading: partnership posts lead to the quota check, the rest to Cek Unit. */
export async function PostCta({ category }: { category: PostCategory }) {
  const forPartners = category === "kemitraan";
  const t = await getTranslations(forPartners ? "Blog.post.partnerCta" : "Blog.post.parentCta");
  const tWhatsApp = await getTranslations("WhatsApp");
  const contact = await getContactSettings();

  return (
    <aside
      aria-labelledby="post-cta-title"
      className="relative isolate overflow-hidden rounded-3xl border border-border/60 p-6 shadow-glow-partner bg-gradient-warm sm:p-8"
    >
      <DecorBlob tone={forPartners ? "partner" : "primary"} className="-top-16 -right-16 size-56" />
      <div className="flex flex-col gap-4">
        <h2 id="post-cta-title" className="text-h4 text-foreground">
          {t("title")}
        </h2>
        <p className="text-body text-muted-foreground">{t("text")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant={forPartners ? "partner" : "primary"} pop>
            <Link href={forPartners ? { pathname: "/kemitraan", hash: "kuota" } : "/cek-unit"}>
              {forPartners ? <ClipboardPenIcon aria-hidden /> : <MapPinIcon aria-hidden />}
              {t("primary")}
            </Link>
          </Button>
          <Button asChild variant="secondary" pop>
            <a
              href={buildWhatsAppUrl(
                contact.whatsapp,
                tWhatsApp(forPartners ? "partner" : "general"),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <BrandIcon name="whatsapp" className="text-whatsapp" />
              {t("secondary")}
            </a>
          </Button>
        </div>
      </div>
    </aside>
  );
}
