import { getLocale, getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { CopyLinkButton } from "@/components/site/copy-link-button";
import { Button } from "@/components/ui/button";
import type { Post } from "@/features/blog/schema";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { buildWhatsAppShareUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/** Share on WhatsApp (plain link, the main channel for parents) and copy the article link. */
export async function ShareLinks({ post, className }: { post: Post; className?: string }) {
  const t = await getTranslations("Blog.post");
  const locale = (await getLocale()) as Locale;
  const url = absoluteUrl(
    getPathname({ href: { pathname: "/blog/[slug]", params: { slug: post.slug } }, locale }),
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-overline text-muted-foreground uppercase">{t("share")}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <a
            href={buildWhatsAppShareUrl(t("shareMessage", { title: post.title, url }))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BrandIcon name="whatsapp" className="size-4 text-whatsapp" />
            {t("shareWhatsApp")}
          </a>
        </Button>
        <CopyLinkButton
          variant="secondary"
          compact={false}
          labels={{ share: t("copyLink"), copied: t("copied"), failed: t("copyFailed") }}
        />
      </div>
    </div>
  );
}
