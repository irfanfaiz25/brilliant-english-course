import { HandshakeIcon, MapPinOffIcon, SearchXIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { DecorBlob } from "@/components/site/decor-blob";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { Region } from "@/features/regions/schema";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type FinderEmptyStateProps =
  { kind: "region"; region: Region; widerRegion: Region | null } | { kind: "query"; query: string };

/**
 * No results is a turning point, not a dead end (DESIGN.md § 5.1): an empty area becomes a
 * partnership opportunity, and both cases offer a wider search and a human to ask.
 */
export async function FinderEmptyState(props: FinderEmptyStateProps) {
  const t = await getTranslations("Finder.empty");
  const tWhatsApp = await getTranslations("WhatsApp");
  const isRegion = props.kind === "region";

  return (
    <div className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-12 text-center shadow-card sm:px-12">
      <DecorBlob tone="partner" className="-top-20 -right-16 size-64 opacity-60" />
      <DecorBlob tone="primary" className="-bottom-24 -left-16 size-64 opacity-60" />
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-partner-soft text-partner shadow-glow-partner [&_svg]:size-8">
        {isRegion ? <MapPinOffIcon aria-hidden /> : <SearchXIcon aria-hidden />}
      </span>
      <h2 className="max-w-xl text-h3 text-foreground">
        {isRegion
          ? t("regionTitle", { area: props.region.name })
          : t("queryTitle", { query: props.query })}
      </h2>
      <p className="max-w-xl text-body text-muted-foreground">
        {isRegion ? t("regionText") : t("queryText")}
      </p>

      <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        {isRegion && (
          <Button asChild variant="partner" pop>
            <Link
              href={{
                pathname: "/kemitraan",
                query: { wilayah: props.region.code },
                hash: "daftar",
              }}
            >
              <HandshakeIcon aria-hidden />
              {t("partnerCta")}
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary" pop>
          {isRegion && props.widerRegion ? (
            <Link
              href={{ pathname: "/cek-unit", query: { wilayah: props.widerRegion.code } }}
              scroll={false}
            >
              {t("widen", { area: props.widerRegion.name })}
            </Link>
          ) : (
            <Link href="/cek-unit" scroll={false}>
              {t("showAll")}
            </Link>
          )}
        </Button>
      </div>
      <a
        href={buildWhatsAppUrl(siteConfig.contact.whatsapp, tWhatsApp("general"))}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-label text-primary underline-offset-4 hover:underline"
      >
        <BrandIcon name="whatsapp" className="size-4 text-whatsapp" />
        {t("ask")}
      </a>
    </div>
  );
}
